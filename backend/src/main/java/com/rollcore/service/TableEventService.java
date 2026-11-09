package com.rollcore.service;

import com.rollcore.dto.request.CreateEventRequest;
import com.rollcore.dto.request.RsvpRequest;
import com.rollcore.dto.response.EventResponse;
import com.rollcore.entity.GameTableMember;
import com.rollcore.entity.GameTableMember.Role;
import com.rollcore.entity.Notification;
import com.rollcore.entity.TableEvent;
import com.rollcore.entity.TableEventRsvp;
import com.rollcore.entity.TableEventRsvp.Status;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.GameTableMemberRepository;
import com.rollcore.repository.TableEventRepository;
import com.rollcore.repository.TableEventRsvpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Calendar of the game tables. Every member of a table sees its events and can answer them;
 * only the master and moderators schedule events, and only the creator or the master removes one.
 * Non-members get 404 so a table's existence is never revealed.
 */
@Service
@RequiredArgsConstructor
public class TableEventService {

    private final TableEventRepository     events;
    private final TableEventRsvpRepository rsvps;
    private final GameTableMemberRepository members;
    private final NotificationService       notifications;

    @Transactional
    public EventResponse create(UUID tableId, UUID userId, CreateEventRequest req) {
        GameTableMember me = requireMember(tableId, userId);
        if (me.getRole() == Role.PLAYER) {
            throw new ForbiddenException("Only the master or a moderator can schedule events.");
        }

        TableEvent event = events.save(TableEvent.builder()
                .gameTable(me.getGameTable())
                .createdBy(me.getUser())
                .title(req.title().trim())
                .description(blankToNull(req.description()))
                .eventDate(req.date())
                .startTime(req.start())
                .endTime(req.end())
                .repeat(req.repeat() != null ? req.repeat() : TableEvent.Repeat.NONE)
                .color(req.color() != null ? req.color() : TableEvent.Color.BLUE)
                .askRsvp(req.askRsvp() == null || req.askRsvp())
                .build());

        // the creator is going by definition
        rsvps.save(TableEventRsvp.builder().event(event).user(me.getUser()).status(Status.YES).build());

        String actor = me.getDisplayName() != null && !me.getDisplayName().isBlank()
                ? me.getDisplayName() : me.getUser().getUsername();
        for (GameTableMember m : members.findByGameTableIdOrderByJoinedAtAsc(tableId)) {
            if (!m.getUser().getId().equals(userId)) {
                notifications.sendToMember(m, Notification.Type.EVENT_CREATED, actor, event.getTitle(), event.getId());
            }
        }
        return render(List.of(event)).get(0);
    }

    /** Every event of every table the caller belongs to, in calendar order. */
    @Transactional(readOnly = true)
    public List<EventResponse> list(UUID userId) {
        List<GameTableMember> mine = members.findByUserIdOrderByJoinedAtDesc(userId);
        if (mine.isEmpty()) return List.of();
        List<UUID> tableIds = mine.stream().map(m -> m.getGameTable().getId()).toList();
        return render(events.findByGameTableIdInOrderByEventDateAscStartTimeAsc(tableIds));
    }

    @Transactional
    public void delete(UUID eventId, UUID userId) {
        TableEvent event = events.findById(eventId).orElseThrow(() -> new NotFoundException("Event not found."));
        GameTableMember me = requireMember(event.getGameTable().getId(), userId);
        boolean creator = event.getCreatedBy().getId().equals(userId);
        if (!creator && me.getRole() != Role.MASTER) {
            throw new ForbiddenException("Only the creator or the master can delete this event.");
        }
        events.delete(event);
    }

    /** Sets (or changes) the caller's answer; returns the refreshed event. */
    @Transactional
    public EventResponse respond(UUID eventId, UUID userId, RsvpRequest req) {
        TableEvent event = events.findById(eventId).orElseThrow(() -> new NotFoundException("Event not found."));
        GameTableMember me = requireMember(event.getGameTable().getId(), userId);

        TableEventRsvp answer = rsvps.findByEventIdAndUserId(eventId, userId)
                .orElseGet(() -> TableEventRsvp.builder().event(event).user(me.getUser()).build());
        answer.setStatus(req.status());
        rsvps.save(answer);
        return render(List.of(event)).get(0);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private List<EventResponse> render(List<TableEvent> list) {
        if (list.isEmpty()) return List.of();
        Set<UUID> tableIds = list.stream().map(e -> e.getGameTable().getId()).collect(Collectors.toSet());
        Map<UUID, List<String>> guestsByTable = new HashMap<>();
        for (GameTableMember m : members.findByGameTableIdIn(tableIds)) {
            guestsByTable.computeIfAbsent(m.getGameTable().getId(), k -> new ArrayList<>()).add(m.getUser().getUsername());
        }
        Map<UUID, Map<String, String>> rsvpByEvent = new HashMap<>();
        for (TableEventRsvp r : rsvps.findByEventIdIn(list.stream().map(TableEvent::getId).toList())) {
            rsvpByEvent.computeIfAbsent(r.getEvent().getId(), k -> new LinkedHashMap<>())
                    .put(r.getUser().getUsername(), r.getStatus().name());
        }
        return list.stream()
                .map(e -> EventResponse.from(e,
                        guestsByTable.getOrDefault(e.getGameTable().getId(), List.of()),
                        rsvpByEvent.getOrDefault(e.getId(), Map.of())))
                .toList();
    }

    private GameTableMember requireMember(UUID tableId, UUID userId) {
        return members.findByGameTableIdAndUserId(tableId, userId)
                .orElseThrow(() -> new NotFoundException("Table not found."));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
