package com.rollcore.service;

import com.rollcore.dto.response.NotificationListResponse;
import com.rollcore.dto.response.NotificationResponse;
import com.rollcore.entity.GameTableMember;
import com.rollcore.entity.Notification;
import com.rollcore.entity.Notification.Type;
import com.rollcore.entity.User;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * In-app notifications: other services call {@code send}/{@code sendToMember} to record
 * something that happened; users list them and mark them as read.
 *
 * <p>A member who muted a table ("Perfil da Mesa" → silenciar) does not receive that table's
 * informational notifications ({@code sendToMember}); access changes (removal, table deleted,
 * host transfer) are always delivered with {@code send}.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int DETAIL_MAX = 200;

    private final NotificationRepository notifications;

    /** Records a notification unconditionally. {@code tableId} is null when the recipient can no longer open the table. */
    @Transactional
    public void send(User recipient, Type type, UUID tableId, String tableName, String actorName, String detail) {
        notifications.save(Notification.builder()
                .user(recipient)
                .type(type)
                .tableId(tableId)
                .tableName(tableName)
                .actorName(actorName)
                .detail(detail == null ? null : truncate(detail))
                .build());
    }

    /** Records a notification about a table the recipient still belongs to, unless they muted it. */
    @Transactional
    public void sendToMember(GameTableMember recipient, Type type, String actorName, String detail) {
        if (recipient.isMuted()) return;
        send(recipient.getUser(), type,
                recipient.getGameTable().getId(), recipient.getGameTable().getName(), actorName, detail);
    }

    @Transactional(readOnly = true)
    public NotificationListResponse list(UUID userId) {
        return new NotificationListResponse(
                notifications.findTop50ByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(NotificationResponse::from).toList(),
                notifications.countByUserIdAndReadAtIsNull(userId));
    }

    @Transactional
    public void markRead(UUID id, UUID userId) {
        Notification n = notifications.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Notification not found."));
        if (n.getReadAt() == null) {
            n.setReadAt(Instant.now());
            notifications.save(n);
        }
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notifications.markAllRead(userId, Instant.now());
    }

    private static String truncate(String s) {
        return s.length() <= DETAIL_MAX ? s : s.substring(0, DETAIL_MAX);
    }
}
