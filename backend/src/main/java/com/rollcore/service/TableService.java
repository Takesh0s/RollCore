package com.rollcore.service;

import com.rollcore.dto.request.ChangeRoleRequest;
import com.rollcore.dto.request.CreateTableRequest;
import com.rollcore.dto.request.JoinTableRequest;
import com.rollcore.dto.request.UpdateMemberProfileRequest;
import com.rollcore.dto.request.UpdateTableRequest;
import com.rollcore.dto.response.InviteCodeResponse;
import com.rollcore.dto.response.MemberResponse;
import com.rollcore.dto.response.MemberSelfResponse;
import com.rollcore.dto.response.TableDetailResponse;
import com.rollcore.dto.response.TablePreviewResponse;
import com.rollcore.dto.response.TableSummaryResponse;
import com.rollcore.entity.GameTable;
import com.rollcore.entity.GameTableMember;
import com.rollcore.entity.GameTableMember.Role;
import com.rollcore.entity.User;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.GameTableMemberRepository;
import com.rollcore.repository.GameTableRepository;
import com.rollcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Game tables ("mesas") and their membership — Fase 2a.
 *
 * <ul>
 *   <li>Players join with an 8-char invite code; the master can regenerate it.
 *   <li>{@code maxPlayers} counts every member, the master included.
 *   <li>Visibility: a table that the caller does not belong to answers 404 (never 403),
 *       so table IDs cannot be enumerated. Members lacking the required role get 403.
 *   <li>Joins and edits lock the table row, so the player cap cannot be exceeded by a race.
 * </ul>
 */
@Service
public class TableService {

    static final String DEFAULT_SYSTEM      = "D&D 5e";
    static final int    DEFAULT_MAX_PLAYERS = 5;

    /** No 0/O/1/I so codes are easy to read aloud and type. */
    private static final String       CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int          CODE_LENGTH   = 8;
    private static final SecureRandom RANDOM        = new SecureRandom();

    private final GameTableRepository       tables;
    private final GameTableMemberRepository members;
    private final UserRepository            users;
    private final int                       maxOwnedPerUser;

    public TableService(GameTableRepository tables,
                        GameTableMemberRepository members,
                        UserRepository users,
                        @Value("${rollcore.tables.max-owned-per-user:10}") int maxOwnedPerUser) {
        this.tables          = tables;
        this.members         = members;
        this.users           = users;
        this.maxOwnedPerUser = maxOwnedPerUser;
    }

    // ── Create / read ─────────────────────────────────────────────────────────

    @Transactional
    public TableDetailResponse create(UUID userId, CreateTableRequest req) {
        User user = users.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));

        if (tables.countByOwnerId(userId) >= maxOwnedPerUser) {
            throw new ConflictException("Table limit reached (" + maxOwnedPerUser + " per user).");
        }

        GameTable table = tables.save(GameTable.builder()
                .owner(user)
                .name(req.name().trim())
                .gameSystem(blankToNull(req.gameSystem()) != null ? req.gameSystem().trim() : DEFAULT_SYSTEM)
                .description(blankToNull(req.description()))
                .maxPlayers(req.maxPlayers() != null ? req.maxPlayers() : DEFAULT_MAX_PLAYERS)
                .coverUrl(blankToNull(req.coverUrl()))
                .inviteCode(newInviteCode())
                .build());

        GameTableMember master = members.save(GameTableMember.builder()
                .gameTable(table)
                .user(user)
                .role(Role.MASTER)
                .build());

        return detail(table, master);
    }

    @Transactional(readOnly = true)
    public List<TableSummaryResponse> list(UUID userId) {
        List<GameTableMember> mine = members.findByUserIdOrderByJoinedAtDesc(userId);
        if (mine.isEmpty()) return List.of();

        Map<UUID, Integer> counts = new HashMap<>();
        List<UUID> ids = mine.stream().map(m -> m.getGameTable().getId()).toList();
        for (Object[] row : members.countByGameTableIds(ids)) {
            counts.put((UUID) row[0], ((Number) row[1]).intValue());
        }

        return mine.stream()
                .map(m -> TableSummaryResponse.from(
                        m.getGameTable(),
                        counts.getOrDefault(m.getGameTable().getId(), 0),
                        m.getRole().name()))
                .toList();
    }

    @Transactional(readOnly = true)
    public TableDetailResponse get(UUID tableId, UUID userId) {
        GameTableMember me = requireMember(tableId, userId);
        return detail(me.getGameTable(), me);
    }

    // ── Edit / delete ─────────────────────────────────────────────────────────

    @Transactional
    public TableDetailResponse update(UUID tableId, UUID userId, UpdateTableRequest req) {
        GameTableMember me = requireMember(tableId, userId);
        requireRole(me, "Only the table master can edit the table.", Role.MASTER);

        GameTable table = lock(tableId);
        long current = members.countByGameTableId(tableId);
        if (req.maxPlayers() < current) {
            throw new ConflictException(
                    "The table already has " + current + " members; remove some before lowering the limit.");
        }

        table.setName(req.name().trim());
        table.setGameSystem(req.gameSystem().trim());
        table.setDescription(blankToNull(req.description()));
        table.setMaxPlayers(req.maxPlayers());
        table.setCoverUrl(blankToNull(req.coverUrl()));
        tables.save(table);

        return detail(table, me);
    }

    @Transactional
    public void delete(UUID tableId, UUID userId) {
        GameTableMember me = requireMember(tableId, userId);
        requireRole(me, "Only the table master can delete the table.", Role.MASTER);

        GameTable table = lock(tableId);
        members.deleteByGameTableId(tableId);
        tables.delete(table);
    }

    // ── Joining ───────────────────────────────────────────────────────────────

    /** Public info shown on "Ingressar Mesa" before the user commits. */
    @Transactional(readOnly = true)
    public TablePreviewResponse preview(String inviteCode) {
        GameTable table = tables.findByInviteCode(normalize(inviteCode))
                .orElseThrow(() -> new NotFoundException("Invalid invite code."));

        int count = (int) members.countByGameTableId(table.getId());
        return new TablePreviewResponse(
                table.getName(),
                table.getGameSystem(),
                table.getDescription(),
                table.getCoverUrl(),
                count,
                table.getMaxPlayers(),
                table.getOwner().getUsername(),
                count >= table.getMaxPlayers());
    }

    @Transactional
    public TableDetailResponse join(UUID userId, JoinTableRequest req) {
        GameTable found = tables.findByInviteCode(normalize(req.inviteCode()))
                .orElseThrow(() -> new NotFoundException("Invalid invite code."));
        GameTable table = lock(found.getId());

        if (members.findByGameTableIdAndUserId(table.getId(), userId).isPresent()) {
            throw new ConflictException("You are already a member of this table.");
        }
        if (members.countByGameTableId(table.getId()) >= table.getMaxPlayers()) {
            throw new ConflictException("This table is full.");
        }

        User user = users.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));

        GameTableMember me = members.save(GameTableMember.builder()
                .gameTable(table)
                .user(user)
                .role(Role.PLAYER)
                .build());

        return detail(table, me);
    }

    @Transactional
    public void leave(UUID tableId, UUID userId) {
        GameTableMember me = requireMember(tableId, userId);
        if (me.getRole() == Role.MASTER) {
            throw new ConflictException("The master cannot leave the table; delete it instead.");
        }
        members.delete(me);
    }

    @Transactional
    public String regenerateInviteCode(UUID tableId, UUID userId) {
        GameTableMember me = requireMember(tableId, userId);
        requireRole(me, "Only the table master can regenerate the invite code.", Role.MASTER);

        GameTable table = lock(tableId);
        table.setInviteCode(newInviteCode());
        tables.save(table);
        return table.getInviteCode();
    }

    // ── Membership management ─────────────────────────────────────────────────

    /** "Perfil da Mesa": per-table display name, avatar and notification mute. */
    @Transactional
    public MemberSelfResponse updateMyProfile(UUID tableId, UUID userId, UpdateMemberProfileRequest req) {
        GameTableMember me = requireMember(tableId, userId);

        if (req.displayName() != null) me.setDisplayName(blankToNull(req.displayName()));
        if (req.avatarUrl()   != null) me.setAvatarUrl(blankToNull(req.avatarUrl()));
        if (req.muted()       != null) me.setMuted(req.muted());

        members.save(me);
        return MemberSelfResponse.from(me);
    }

    @Transactional
    public void removeMember(UUID tableId, UUID actorId, UUID targetUserId) {
        GameTableMember actor = requireMember(tableId, actorId);
        requireRole(actor, "Only the master or a moderator can remove members.", Role.MASTER, Role.MODERATOR);

        if (actorId.equals(targetUserId)) {
            throw new ConflictException("Use the leave endpoint to leave the table.");
        }

        GameTableMember target = members.findByGameTableIdAndUserId(tableId, targetUserId)
                .orElseThrow(() -> new NotFoundException("Member not found."));

        if (target.getRole() == Role.MASTER) {
            throw new ForbiddenException("The master cannot be removed.");
        }
        if (actor.getRole() == Role.MODERATOR && target.getRole() == Role.MODERATOR) {
            throw new ForbiddenException("Moderators cannot remove other moderators.");
        }

        members.delete(target);
    }

    @Transactional
    public MemberResponse changeRole(UUID tableId, UUID actorId, UUID targetUserId, ChangeRoleRequest req) {
        GameTableMember actor = requireMember(tableId, actorId);
        requireRole(actor, "Only the table master can change roles.", Role.MASTER);

        if (actorId.equals(targetUserId)) {
            throw new ConflictException("The master's role cannot be changed.");
        }

        GameTableMember target = members.findByGameTableIdAndUserId(tableId, targetUserId)
                .orElseThrow(() -> new NotFoundException("Member not found."));

        target.setRole(Role.valueOf(req.role()));
        members.save(target);
        return MemberResponse.from(target);
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private TableDetailResponse detail(GameTable table, GameTableMember me) {
        List<GameTableMember> all = members.findByGameTableIdOrderByJoinedAtAsc(table.getId());
        boolean staff = me.getRole() != Role.PLAYER;

        return new TableDetailResponse(
                TableSummaryResponse.from(table, all.size(), me.getRole().name()),
                staff ? table.getInviteCode() : null,
                all.stream().map(MemberResponse::from).toList(),
                MemberSelfResponse.from(me));
    }

    /** 404 for non-members, so the existence of a table is never revealed to outsiders. */
    private GameTableMember requireMember(UUID tableId, UUID userId) {
        return members.findByGameTableIdAndUserId(tableId, userId)
                .orElseThrow(() -> new NotFoundException("Table not found."));
    }

    private void requireRole(GameTableMember member, String message, Role... allowed) {
        for (Role r : allowed) {
            if (member.getRole() == r) return;
        }
        throw new ForbiddenException(message);
    }

    private GameTable lock(UUID tableId) {
        return tables.findByIdForUpdate(tableId)
                .orElseThrow(() -> new NotFoundException("Table not found."));
    }

    private String newInviteCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            String code = sb.toString();
            if (!tables.existsByInviteCode(code)) return code;
        }
        throw new IllegalStateException("Could not generate a unique invite code.");
    }

    private static String normalize(String code) {
        return code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
    }

    private static String blankToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
