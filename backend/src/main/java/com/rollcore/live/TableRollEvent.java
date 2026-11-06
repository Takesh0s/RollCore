package com.rollcore.live;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A roll made in a table, as broadcast to its members on {@code /topic/tables/{id}/rolls}.
 *
 * <p>{@code label}, {@code mode} and {@code discardedRolls} are optional extras (reason,
 * advantage/disadvantage and the discarded dice); clients that ignore them keep working.
 */
public record TableRollEvent(
    UUID          id,
    UUID          userId,
    String        username,
    String        displayName,
    String        formula,
    List<Integer> rolls,
    int           mod,
    int           total,
    Instant       rolledAt,
    String        label,
    String        mode,
    List<Integer> discardedRolls
) {
    /** Plain roll: no label, normal mode. */
    public TableRollEvent(UUID id, UUID userId, String username, String displayName,
                          String formula, List<Integer> rolls, int mod, int total,
                          Instant rolledAt) {
        this(id, userId, username, displayName, formula, rolls, mod, total, rolledAt,
                null, "normal", null);
    }
}
