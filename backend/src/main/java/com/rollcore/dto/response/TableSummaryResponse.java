package com.rollcore.dto.response;

import com.rollcore.entity.GameTable;

import java.time.Instant;
import java.util.UUID;

/** Card shown on the "Mesas" list. {@code myRole} is the caller's role in the table. */
public record TableSummaryResponse(
    UUID    id,
    String  name,
    String  gameSystem,
    String  description,
    int     maxPlayers,
    int     playerCount,
    String  coverUrl,
    String  myRole,
    String  ownerUsername,
    Instant createdAt
) {
    public static TableSummaryResponse from(GameTable t, int playerCount, String myRole) {
        return new TableSummaryResponse(
            t.getId(),
            t.getName(),
            t.getGameSystem(),
            t.getDescription(),
            t.getMaxPlayers(),
            playerCount,
            t.getCoverUrl(),
            myRole,
            t.getOwner().getUsername(),
            t.getCreatedAt());
    }
}
