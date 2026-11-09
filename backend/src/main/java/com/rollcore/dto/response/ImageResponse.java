package com.rollcore.dto.response;

import java.util.UUID;

/** {@code url} is a path ({@code /images/{id}}) relative to the API host; it is what tables store as their cover. */
public record ImageResponse(UUID id, String url) {
    public static ImageResponse of(UUID id) {
        return new ImageResponse(id, "/images/" + id);
    }
}
