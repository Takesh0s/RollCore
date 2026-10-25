package com.rollcore.live;

import java.util.List;
import java.util.UUID;

/** Who is currently connected to a table, broadcast on {@code /topic/tables/{id}/presence}. */
public record PresenceEvent(UUID tableId, List<Online> online) {

    public record Online(UUID userId, String username) {}
}
