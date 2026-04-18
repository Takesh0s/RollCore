package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Persisted roll result.
 * Mirrors the {@code dice_rolls} table — Arquitetura §6.4 / UC-03 RN-02.
 *
 * <p>{@code sessionId} is nullable: {@code null} = out-of-session roll (UC-03 RN-02).
 * Populated in Fase 2 when a roll is made inside a live session.
 */
@Entity
@Table(name = "dice_rolls")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DiceRoll {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * FK to sessions table — null for out-of-session rolls (UC-03 RN-02).
     * Raw UUID to avoid coupling with the Session entity until Fase 2.
     */
    @Column(name = "session_id")
    private UUID sessionId;

    /**
     * Validated dice formula — e.g. "2d6+3".
     * Format: NdX | NdX+M | NdX-M (N=1-99, X ∈ {4,6,8,10,12,20,100}).
     * UC-03 RN-01 / dice.ts FORMULA_REGEX.
     */
    @Column(nullable = false, length = 50)
    private String formula;

    /**
     * Individual die results as a JSONB int array — e.g. [4, 2].
     * Mirrors RollResult.rolls in types/index.ts.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "individual_results", columnDefinition = "jsonb", nullable = false)
    private List<Integer> individualResults;

    /** Sum of all dice + modifier. */
    @Column(nullable = false)
    private int total;

    @Column(name = "rolled_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant rolledAt = Instant.now();
}
