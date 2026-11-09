package com.rollcore.service;

import com.rollcore.dto.response.NotificationListResponse;
import com.rollcore.entity.GameTable;
import com.rollcore.entity.GameTableMember;
import com.rollcore.entity.GameTableMember.Role;
import com.rollcore.entity.Notification;
import com.rollcore.entity.Notification.Type;
import com.rollcore.entity.User;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService — create, list and mark as read")
class NotificationServiceTest {

    @Mock NotificationRepository notifications;

    private NotificationService service;

    private final UUID userId  = UUID.randomUUID();
    private final UUID tableId = UUID.randomUUID();
    private User user;
    private GameTable table;

    @BeforeEach
    void setUp() {
        service = new NotificationService(notifications);
        user  = User.builder().id(userId).username("ply").email("p@x.com").passwordHash("h").build();
        table = GameTable.builder().id(tableId).owner(user).name("Em busca dos esquecidos")
                .gameSystem("D&D 5e").maxPlayers(5).inviteCode("ABCD2345").build();
    }

    private GameTableMember member(boolean muted) {
        return GameTableMember.builder().id(UUID.randomUUID()).gameTable(table).user(user)
                .role(Role.PLAYER).muted(muted).build();
    }

    @Test @DisplayName("send() stores the notification with its snapshot fields")
    void sendStores() {
        service.send(user, Type.ROLE_CHANGED, tableId, "Mesa", "gm", "MODERATOR");

        ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
        verify(notifications).save(cap.capture());
        Notification n = cap.getValue();
        assertThat(n.getUser()).isSameAs(user);
        assertThat(n.getType()).isEqualTo(Type.ROLE_CHANGED);
        assertThat(n.getTableId()).isEqualTo(tableId);
        assertThat(n.getTableName()).isEqualTo("Mesa");
        assertThat(n.getActorName()).isEqualTo("gm");
        assertThat(n.getDetail()).isEqualTo("MODERATOR");
        assertThat(n.getReadAt()).isNull();
    }

    @Test @DisplayName("send() truncates a very long detail to the column size")
    void sendTruncates() {
        service.send(user, Type.EVENT_CREATED, tableId, "Mesa", "gm", "x".repeat(500));

        ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
        verify(notifications).save(cap.capture());
        assertThat(cap.getValue().getDetail()).hasSize(200);
    }

    @Test @DisplayName("sendToMember() records the table of the membership")
    void sendToMemberStores() {
        service.sendToMember(member(false), Type.MEMBER_JOINED, "ply", null);

        ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
        verify(notifications).save(cap.capture());
        assertThat(cap.getValue().getTableId()).isEqualTo(tableId);
        assertThat(cap.getValue().getTableName()).isEqualTo("Em busca dos esquecidos");
    }

    @Test @DisplayName("sendToMember() with an event id stores it")
    void sendToMemberWithEvent() {
        UUID eventId = UUID.randomUUID();
        service.sendToMember(member(false), Type.EVENT_CREATED, "gm", "Sessão 13", eventId);

        ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
        verify(notifications).save(cap.capture());
        assertThat(cap.getValue().getEventId()).isEqualTo(eventId);
        assertThat(cap.getValue().getDetail()).isEqualTo("Sessão 13");
    }

    @Test @DisplayName("sendToMember() respects a muted table")
    void sendToMemberMuted() {
        service.sendToMember(member(true), Type.MEMBER_JOINED, "ply", null);

        verifyNoInteractions(notifications);
    }

    @Test @DisplayName("list() returns the latest notifications and the unread total")
    void listReturnsPageAndUnread() {
        Notification unread = Notification.builder().id(UUID.randomUUID()).user(user).type(Type.MEMBER_JOINED)
                .tableId(tableId).tableName("Mesa").actorName("ply").createdAt(Instant.now()).build();
        Notification read = Notification.builder().id(UUID.randomUUID()).user(user).type(Type.TABLE_DELETED)
                .tableName("Outra").readAt(Instant.now()).createdAt(Instant.now()).build();
        when(notifications.findTop50ByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(unread, read));
        when(notifications.countByUserIdAndReadAtIsNull(userId)).thenReturn(7L);

        NotificationListResponse r = service.list(userId);

        assertThat(r.unread()).isEqualTo(7);
        assertThat(r.items()).hasSize(2);
        assertThat(r.items().get(0).read()).isFalse();
        assertThat(r.items().get(0).type()).isEqualTo("MEMBER_JOINED");
        assertThat(r.items().get(1).read()).isTrue();
        assertThat(r.items().get(1).tableId()).isNull();
    }

    @Test @DisplayName("markRead() sets readAt once")
    void markReadSetsOnce() {
        UUID id = UUID.randomUUID();
        Notification n = Notification.builder().id(id).user(user).type(Type.MEMBER_LEFT).build();
        when(notifications.findByIdAndUserId(id, userId)).thenReturn(Optional.of(n));

        service.markRead(id, userId);
        Instant first = n.getReadAt();
        service.markRead(id, userId);

        assertThat(first).isNotNull();
        assertThat(n.getReadAt()).isEqualTo(first);
        verify(notifications, times(1)).save(n);
    }

    @Test @DisplayName("markRead() on someone else's notification is 404")
    void markReadOfOtherUser() {
        UUID id = UUID.randomUUID();
        when(notifications.findByIdAndUserId(id, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.markRead(id, userId)).isInstanceOf(NotFoundException.class);

        verify(notifications, never()).save(any(Notification.class));
    }

    @Test @DisplayName("markAllRead() updates every unread row of the caller")
    void markAllRead() {
        service.markAllRead(userId);

        verify(notifications).markAllRead(org.mockito.ArgumentMatchers.eq(userId), any(Instant.class));
    }
}
