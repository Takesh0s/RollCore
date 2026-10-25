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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TableSessionService")
class TableSessionServiceTest {

    @Mock GameTableMemberRepository members;
    @Mock DiceRollRepository        rolls;
    @Mock UserRepository            users;
    @Mock DiceService               dice;
    @Mock SimpMessagingTemplate     messaging;

    private final PresenceService presence = new PresenceService();
    private TableSessionService service;

    private final UUID tableId = UUID.randomUUID();
    private final UUID userId  = UUID.randomUUID();
    private User user;

    @BeforeEach
    void setUp() {
        service = new TableSessionService(members, rolls, users, dice, presence, messaging);
        user = User.builder().id(userId).username("ana").email("ana@x.com").passwordHash("h").build();
    }

    private GameTableMember member(String displayName) {
        return GameTableMember.builder().user(user).role(GameTableMember.Role.PLAYER).displayName(displayName).build();
    }

    // ── roll ──────────────────────────────────────────────────────────────────

    @Test @DisplayName("a member's roll is saved on the table and broadcast to its topic")
    void rollBroadcasts() {
        UUID rollId = UUID.randomUUID();
        Instant now = Instant.now();
        when(members.findByGameTableIdAndUserId(tableId, userId)).thenReturn(Optional.of(member("Aelar")));
        when(dice.rollInTable(eq(userId), eq(tableId), any(RollRequest.class)))
                .thenReturn(new RollResponse(rollId, "2d6+3", List.of(4, 2), 3, 9, now));

        TableRollEvent event = service.roll(tableId, userId, new RollRequest("2d6+3"));

        assertThat(event.id()).isEqualTo(rollId);
        assertThat(event.username()).isEqualTo("ana");
        assertThat(event.displayName()).isEqualTo("Aelar");
        assertThat(event.total()).isEqualTo(9);
        assertThat(event.rolls()).containsExactly(4, 2);

        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(messaging).convertAndSend(eq("/topic/tables/" + tableId + "/rolls"), payload.capture());
        assertThat(payload.getValue()).isEqualTo(event);
    }

    @Test @DisplayName("the display name falls back to the username when the member has none")
    void rollFallsBackToUsername() {
        when(members.findByGameTableIdAndUserId(tableId, userId)).thenReturn(Optional.of(member(null)));
        when(dice.rollInTable(eq(userId), eq(tableId), any(RollRequest.class)))
                .thenReturn(new RollResponse(UUID.randomUUID(), "1d20", List.of(15), 0, 15, Instant.now()));

        assertThat(service.roll(tableId, userId, new RollRequest("1d20")).displayName()).isEqualTo("ana");
    }

    @Test @DisplayName("a non-member cannot roll and nothing is rolled or sent")
    void rollRequiresMembership() {
        when(members.findByGameTableIdAndUserId(tableId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.roll(tableId, userId, new RollRequest("1d20")))
                .isInstanceOf(NotFoundException.class);

        verifyNoInteractions(dice);
        verifyNoInteractions(messaging);
    }

    // ── history ───────────────────────────────────────────────────────────────

    @Test @DisplayName("history maps stored rolls, using the member's display name")
    void history() {
        when(members.findByGameTableIdAndUserId(tableId, userId)).thenReturn(Optional.of(member("Aelar")));
        when(members.findByGameTableIdOrderByJoinedAtAsc(tableId)).thenReturn(List.of(member("Aelar")));
        DiceRoll stored = DiceRoll.builder().id(UUID.randomUUID()).user(user).gameTableId(tableId)
                .formula("2d6+3").individualResults(List.of(4, 2)).total(9).build();
        when(rolls.findByGameTableIdOrderByRolledAtDesc(tableId, PageRequest.of(0, 50))).thenReturn(List.of(stored));

        List<TableRollEvent> result = service.history(tableId, userId, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).displayName()).isEqualTo("Aelar");
        assertThat(result.get(0).mod()).isEqualTo(3);
        assertThat(result.get(0).total()).isEqualTo(9);
    }

    @Test @DisplayName("history limit is clamped to 1..100")
    void historyLimit() {
        when(members.findByGameTableIdAndUserId(tableId, userId)).thenReturn(Optional.of(member(null)));
        when(rolls.findByGameTableIdOrderByRolledAtDesc(eq(tableId), any())).thenReturn(List.of());

        service.history(tableId, userId, 500);
        service.history(tableId, userId, 0);

        verify(rolls).findByGameTableIdOrderByRolledAtDesc(tableId, PageRequest.of(0, 100));
        verify(rolls).findByGameTableIdOrderByRolledAtDesc(tableId, PageRequest.of(0, 1));
    }

    @Test @DisplayName("a non-member cannot read the history")
    void historyRequiresMembership() {
        when(members.findByGameTableIdAndUserId(tableId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.history(tableId, userId, null)).isInstanceOf(NotFoundException.class);
        verify(rolls, never()).findByGameTableIdOrderByRolledAtDesc(any(), any());
    }

    // ── presence ──────────────────────────────────────────────────────────────

    @Test @DisplayName("presence lists connected members sorted by username")
    void presenceSnapshot() {
        User bruno = User.builder().id(UUID.randomUUID()).username("Bruno").email("b@x.com").passwordHash("h").build();
        presence.join("s1", "sub-0", tableId, userId);
        presence.join("s2", "sub-0", tableId, bruno.getId());
        when(members.findByGameTableIdAndUserId(tableId, userId)).thenReturn(Optional.of(member(null)));
        when(users.findAllById(any())).thenReturn(List.of(bruno, user));

        PresenceEvent event = service.presence(tableId, userId);

        assertThat(event.tableId()).isEqualTo(tableId);
        assertThat(event.online()).extracting(PresenceEvent.Online::username).containsExactly("ana", "Bruno");
    }

    @Test @DisplayName("broadcasting presence publishes the snapshot on the presence topic")
    void broadcastPresence() {
        presence.join("s1", "sub-0", tableId, userId);
        when(users.findAllById(any())).thenReturn(List.of(user));

        service.broadcastPresence(tableId);

        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(messaging).convertAndSend(eq("/topic/tables/" + tableId + "/presence"), payload.capture());
        assertThat(((PresenceEvent) payload.getValue()).online()).hasSize(1);
    }
}
