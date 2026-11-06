package com.rollcore.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Dice roll result returned to the client — UC-03 §3.1 step 9.
 * Mirrors RollResult in types/index.ts.
 *
 * <p>{@code label}, {@code mode}, {@code discardedRolls}, {@code tableId} and
 * {@code tableName} describe how the roll was made; they are {@code null}/"normal"
 * for a plain solo roll.
 */
public record RollResponse(
    UUID          id,
    String        formula,
    List<Integer> rolls,
    int           mod,
    int           total,
    Instant       rolledAt,
    String        label,
    String        mode,
    List<Integer> discardedRolls,
    UUID          tableId,
    String        tableName
) {
    /** Plain solo roll (no label, normal mode, no table). */
    public RollResponse(UUID id, String formula, List<Integer> rolls, int mod, int total,
                        Instant rolledAt) {
        this(id, formula, rolls, mod, total, rolledAt, null, "normal", null, null, null);
    }
}
