package com.rollcore.live;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** A roll made in a table, as broadcast to its members on {@code /topic/tables/{id}/rolls}. */
public record TableRollEvent(
    UUID          id,
    UUID          userId,
    String        username,
    String        displayName,
    String        formula,
    List<Integer> rolls,
    int           mod,
    int           total,
    Instant       rolledAt
) {}
