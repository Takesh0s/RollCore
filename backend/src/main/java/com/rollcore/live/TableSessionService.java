package com.rollcore.live;

import com.rollcore.dto.request.RollRequest;
import com.rollcore.dto.response.RollResponse;
import com.rollcore.entity.DiceRoll;
import com.rollcore.entity.GameTableMember;
import com.rollcore.entity.User;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.DiceRollRepository;
import com.rollcore.repository.GameTableMemberRepository;
import com.rollcore.repository.UserRepository;
import com.rollcore.service.DiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Business rules of a live table session: shared dice rolls and presence.
 *
 * <p>Only members of a table may roll, read its history or see who is online. Anyone
 * else gets the same 404 as for a table that does not exist, so ids cannot be probed.
 */
@Service
@RequiredArgsConstructor
public class TableSessionService {

    static final int DEFAULT_HISTORY = 50;
    static final int MAX_HISTORY     = 100;

    private final GameTableMemberRepository members;
    private final DiceRollRepository        rolls;
    private final UserRepository            users;
    private final DiceService               dice;
    private final PresenceService           presence;
    private final SimpMessagingTemplate     messaging;

    /** Rolls in the table, persists the roll and pushes it to everyone subscribed. */
    @Transactional
    public TableRollEvent roll(UUID tableId, UUID userId, RollRequest request) {
        GameTableMember member = requireMember(tableId, userId);

        RollResponse result = dice.rollInTable(userId, tableId, request);

        TableRollEvent event = new TableRollEvent(
                result.id(), userId, member.getUser().getUsername(), displayName(member),
                result.formula(), result.rolls(), result.mod(), result.total(), result.rolledAt());

        afterCommit(() -> messaging.convertAndSend(Destinations.rolls(tableId), event));
        return event;
    }

    /** Latest rolls of the table, newest first. */
    @Transactional(readOnly = true)
    public List<TableRollEvent> history(UUID tableId, UUID userId, Integer limit) {
        requireMember(tableId, userId);

        int size = limit == null ? DEFAULT_HISTORY : Math.max(1, Math.min(limit, MAX_HISTORY));
        List<DiceRoll> latest = rolls.findByGameTableIdOrderByRolledAtDesc(tableId, PageRequest.of(0, size));

        Map<UUID, GameTableMember> byUser = members.findByGameTableIdOrderByJoinedAtAsc(tableId).stream()
                .collect(Collectors.toMap(m -> m.getUser().getId(), Function.identity(), (a, b) -> a));

        return latest.stream().map(r -> {
            GameTableMember m = byUser.get(r.getUser().getId());
            return new TableRollEvent(
                    r.getId(), r.getUser().getId(), r.getUser().getUsername(),
                    m != null ? displayName(m) : r.getUser().getUsername(),
                    r.getFormula(), r.getIndividualResults(), DiceService.modifierOf(r.getFormula()),
                    r.getTotal(), r.getRolledAt());
        }).toList();
    }

    /** Members currently connected to the table. */
    @Transactional(readOnly = true)
    public PresenceEvent presence(UUID tableId, UUID userId) {
        requireMember(tableId, userId);
        return snapshot(tableId);
    }

    /** Presence snapshot without an authorization check; used when broadcasting. */
    @Transactional(readOnly = true)
    public PresenceEvent snapshot(UUID tableId) {
        List<PresenceEvent.Online> online = users.findAllById(presence.online(tableId)).stream()
                .sorted(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER))
                .map(u -> new PresenceEvent.Online(u.getId(), u.getUsername()))
                .toList();
        return new PresenceEvent(tableId, online);
    }

    /** Pushes the current presence of a table to its subscribers. */
    public void broadcastPresence(UUID tableId) {
        messaging.convertAndSend(Destinations.presence(tableId), snapshot(tableId));
    }

    /** Runs the action once the surrounding transaction commits, or right away outside one. */
    private static void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { action.run(); }
            });
        } else {
            action.run();
        }
    }

    private GameTableMember requireMember(UUID tableId, UUID userId) {
        return members.findByGameTableIdAndUserId(tableId, userId)
                .orElseThrow(() -> new NotFoundException("Table not found."));
    }

    private static String displayName(GameTableMember m) {
        String custom = m.getDisplayName();
        return custom != null && !custom.isBlank() ? custom : m.getUser().getUsername();
    }
}
