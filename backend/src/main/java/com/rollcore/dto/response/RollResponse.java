package com.rollcore.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Dice roll result returned to the client — UC-03 §3.1 step 9.
 * Mirrors RollResult in types/index.ts.
 */
public record RollResponse(
    UUID         id,
    String       formula,
    List<Integer> rolls,
    int          mod,
    int          total,
    Instant      rolledAt
) {}