package com.rollcore.dto.response;

import com.rollcore.entity.Notification;

import java.time.Instant;
import java.util.UUID;

/** One notification; the clients build the sentence from {@code type} and the snapshot fields. */
public record NotificationResponse(
    UUID    id,
    String  type,
    UUID    tableId,
    String  tableName,
    String  actorName,
    String  detail,
    boolean read,
    Instant createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
            n.getId(),
            n.getType().name(),
            n.getTableId(),
            n.getTableName(),
            n.getActorName(),
            n.getDetail(),
            n.getReadAt() != null,
            n.getCreatedAt());
    }
}
