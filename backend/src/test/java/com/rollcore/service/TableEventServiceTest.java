package com.rollcore.service;

import com.rollcore.dto.request.CreateEventRequest;
import com.rollcore.dto.request.RsvpRequest;
import com.rollcore.dto.response.EventResponse;
import com.rollcore.entity.GameTable;
import com.rollcore.entity.GameTableMember;
import com.rollcore.entity.GameTableMember.Role;
import com.rollcore.entity.Notification;
import com.rollcore.entity.TableEvent;
import com.rollcore.entity.TableEventRsvp;
import com.rollcore.entity.TableEventRsvp.Status;
import com.rollcore.entity.User;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.GameTableMemberRepository;
import com.rollcore.repository.TableEventRepository;
import com.rollcore.repository.TableEventRsvpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TableEventService — calendário e confirmação de presença")
class TableEventServiceTest {

    @Mock TableEventRepository     events;
    @Mock TableEventRsvpRepository rsvps;
    @Mock GameTableMemberRepository members;
    @Mock NotificationService       notifications;

    private TableEventService service;

    private final UUID masterId = UUID.randomUUID();
    private final UUID playerId = UUID.randomUUID();
    private final UUID tableId  = UUID.randomUUID();
    private final UUID eventId  = UUID.randomUUID();

    private User master, player;
    private GameTable table;
    private GameTableMember masterM, playerM;
    private TableEvent event;

    @BeforeEach
    void setUp() {
        service = new TableEventService(events, rsvps, members, notifications);
        master = User.builder().id(masterId).username("gm").email("gm@x.com").passwordHash("h").build();
        player = User.builder().id(playerId).username("ply").email("ply@x.com").passwordHash("h").build();
        table = GameTable.builder().id(tableId).owner(master).name("Em busca dos esquecidos")
                .gameSystem("D&D 5e").maxPlayers(5).inviteCode("ABCD2345").createdAt(Instant.now()).build();
        masterM = GameTableMember.builder().id(UUID.randomUUID()).gameTable(table).user(master).role(Role.MASTER).build();
        playerM = GameTableMember.builder().id(UUID.randomUUID()).gameTable(table).user(player).role(Role.PLAYER).build();
        event = TableEvent.builder().id(eventId).gameTable(table).createdBy(master).title("Sessão 13")
                .eventDate(LocalDate.of(2026, 11, 20)).startTime(LocalTime.of(20, 0)).endTime(LocalTime.of(23, 0)).build();
    }

    private void asMember(GameTableMember m) {
        when(members.findByGameTableIdAndUserId(tableId, m.getUser().getId())).thenReturn(Optional.of(m));
    }

    private void stubRender(TableEventRsvp... answers) {
        when(members.findByGameTableIdIn(any())).thenReturn(List.of(masterM, playerM));
        when(rsvps.findByEventIdIn(any())).thenReturn(List.of(answers));
    }

    private CreateEventRequest request() {
        return new CreateEventRequest("  Sessão 13  ", "  ", LocalDate.of(2026, 11, 20),
                LocalTime.of(20, 0), LocalTime.of(23, 0), null, null, null);
    }

    @Nested @DisplayName("create()")
    class CreateTest {

        @Test @DisplayName("the master schedules an event: defaults applied and the creator is marked as going")
        void masterCreates() {
            asMember(masterM);
            when(events.save(any(TableEvent.class))).thenAnswer(inv -> {
                TableEvent e = inv.getArgument(0);
                e.setId(eventId);
                return e;
            });
            when(members.findByGameTableIdIn(any())).thenReturn(List.of(masterM, playerM));
            when(members.findByGameTableIdOrderByJoinedAtAsc(tableId)).thenReturn(List.of(masterM, playerM));
            when(rsvps.findByEventIdIn(any())).thenAnswer(inv -> List.of(
                    TableEventRsvp.builder().event(event).user(master).status(Status.YES).build()));

            EventResponse r = service.create(tableId, masterId, request());

            // everyone but the creator is told about the new event
            verify(notifications).sendToMember(playerM, Notification.Type.EVENT_CREATED, "gm", "Sessão 13");
            verify(notifications, never()).sendToMember(eq(masterM), any(), any(), any());

            ArgumentCaptor<TableEvent> saved = ArgumentCaptor.forClass(TableEvent.class);
            verify(events).save(saved.capture());
            assertThat(saved.getValue().getTitle()).isEqualTo("Sessão 13");
            assertThat(saved.getValue().getDescription()).isNull();
            assertThat(saved.getValue().getRepeat()).isEqualTo(TableEvent.Repeat.NONE);
            assertThat(saved.getValue().getColor()).isEqualTo(TableEvent.Color.BLUE);
            assertThat(saved.getValue().isAskRsvp()).isTrue();

            ArgumentCaptor<TableEventRsvp> answer = ArgumentCaptor.forClass(TableEventRsvp.class);
            verify(rsvps).save(answer.capture());
            assertThat(answer.getValue().getUser()).isSameAs(master);
            assertThat(answer.getValue().getStatus()).isEqualTo(Status.YES);

            assertThat(r.guests()).containsExactly("gm", "ply");
            assertThat(r.rsvp()).containsEntry("gm", "YES").doesNotContainKey("ply");
            assertThat(r.createdBy()).isEqualTo("gm");
        }

        @Test @DisplayName("a plain player cannot schedule events")
        void playerForbidden() {
            asMember(playerM);
            assertThatThrownBy(() -> service.create(tableId, playerId, request()))
                    .isInstanceOf(ForbiddenException.class);
            verify(events, never()).save(any());
        }

        @Test @DisplayName("a non-member gets 404")
        void outsiderNotFound() {
            UUID stranger = UUID.randomUUID();
            when(members.findByGameTableIdAndUserId(tableId, stranger)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.create(tableId, stranger, request()))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    @Nested @DisplayName("list()")
    class ListTest {

        @Test @DisplayName("returns the events of my tables with guests and answers")
        void listsMine() {
            when(members.findByUserIdOrderByJoinedAtDesc(playerId)).thenReturn(List.of(playerM));
            when(events.findByGameTableIdInOrderByEventDateAscStartTimeAsc(any())).thenReturn(List.of(event));
            stubRender(TableEventRsvp.builder().event(event).user(player).status(Status.MAYBE).build());

            List<EventResponse> r = service.list(playerId);

            assertThat(r).hasSize(1);
            assertThat(r.get(0).tableName()).isEqualTo("Em busca dos esquecidos");
            assertThat(r.get(0).rsvp()).containsEntry("ply", "MAYBE");
            assertThat(r.get(0).repeat()).isEqualTo("NONE");
        }

        @Test @DisplayName("a user with no tables gets an empty list without touching the events")
        void noTables() {
            when(members.findByUserIdOrderByJoinedAtDesc(playerId)).thenReturn(List.of());
            assertThat(service.list(playerId)).isEmpty();
            verifyNoInteractions(events);
        }
    }

    @Nested @DisplayName("respond()")
    class RespondTest {

        @Test @DisplayName("creates the answer the first time")
        void firstAnswer() {
            when(events.findById(eventId)).thenReturn(Optional.of(event));
            asMember(playerM);
            when(rsvps.findByEventIdAndUserId(eventId, playerId)).thenReturn(Optional.empty());
            stubRender();

            service.respond(eventId, playerId, new RsvpRequest(Status.NO));

            ArgumentCaptor<TableEventRsvp> c = ArgumentCaptor.forClass(TableEventRsvp.class);
            verify(rsvps).save(c.capture());
            assertThat(c.getValue().getUser()).isSameAs(player);
            assertThat(c.getValue().getStatus()).isEqualTo(Status.NO);
        }

        @Test @DisplayName("changes an existing answer instead of adding another")
        void changesAnswer() {
            TableEventRsvp old = TableEventRsvp.builder().id(UUID.randomUUID()).event(event).user(player).status(Status.NO).build();
            when(events.findById(eventId)).thenReturn(Optional.of(event));
            asMember(playerM);
            when(rsvps.findByEventIdAndUserId(eventId, playerId)).thenReturn(Optional.of(old));
            stubRender(old);

            EventResponse r = service.respond(eventId, playerId, new RsvpRequest(Status.YES));

            assertThat(old.getStatus()).isEqualTo(Status.YES);
            assertThat(r.rsvp()).containsEntry("ply", "YES");
        }

        @Test @DisplayName("404 for an event of a table the caller is not in")
        void outsider() {
            UUID stranger = UUID.randomUUID();
            when(events.findById(eventId)).thenReturn(Optional.of(event));
            when(members.findByGameTableIdAndUserId(tableId, stranger)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.respond(eventId, stranger, new RsvpRequest(Status.YES)))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test @DisplayName("404 for an unknown event")
        void unknownEvent() {
            when(events.findById(eventId)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.respond(eventId, playerId, new RsvpRequest(Status.YES)))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    @Nested @DisplayName("delete()")
    class DeleteTest {

        @Test @DisplayName("the creator deletes their event")
        void creatorDeletes() {
            event.setCreatedBy(player);
            when(events.findById(eventId)).thenReturn(Optional.of(event));
            asMember(playerM);
            service.delete(eventId, playerId);
            verify(events).delete(event);
        }

        @Test @DisplayName("the master deletes an event created by someone else")
        void masterDeletes() {
            event.setCreatedBy(player);
            when(events.findById(eventId)).thenReturn(Optional.of(event));
            asMember(masterM);
            service.delete(eventId, masterId);
            verify(events).delete(event);
        }

        @Test @DisplayName("another member cannot delete it")
        void otherForbidden() {
            when(events.findById(eventId)).thenReturn(Optional.of(event));
            asMember(playerM);
            assertThatThrownBy(() -> service.delete(eventId, playerId)).isInstanceOf(ForbiddenException.class);
            verify(events, never()).delete(any());
        }
    }
}
