package com.rollcore.dto.response;

import com.rollcore.entity.GameMap;
import com.rollcore.entity.GameMap.GridType;
import com.rollcore.entity.GameMap.Kind;

import java.time.Instant;
import java.util.UUID;

/**
 * A map as the clients see it. {@code layers} is the painted terrain / fog JSON, returned as a string
 * (small: it stores cell indexes, not pixels). {@code mine} tells whether the caller owns it.
 */
public record MapResponse(
        UUID id,
        String name,
        Kind kind,
        GridType gridType,
        int cols,
        int rows,
        int cellSize,
        String imageUrl,
        String layers,
        boolean gridVisible,
        boolean fogEnabled,
        boolean published,
        String authorName,
        boolean mine,
        Instant updatedAt
) {
    public static MapResponse of(GameMap m, UUID viewerId) {
        return new MapResponse(
                m.getId(), m.getName(), m.getKind(), m.getGridType(),
                m.getCols(), m.getRows(), m.getCellSize(),
                m.getImageId() == null ? null : ImageResponse.of(m.getImageId()).url(),
                m.getLayers(), m.isGridVisible(), m.isFogEnabled(), m.isPublished(),
                m.getOwner().getUsername(),
                m.getOwner().getId().equals(viewerId),
                m.getUpdatedAt());
    }
}
