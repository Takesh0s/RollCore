package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * A saved dice formula ("Atalhos salvos" on the Dados screen).
 * Mirrors the {@code dice_shortcuts} table — migration V12.
 */
@Entity
@Table(name = "dice_shortcuts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DiceShortcut {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 40)
    private String name;

    /** Validated NdX | NdX+M | NdX-M formula. */
    @Column(nullable = false, length = 50)
    private String formula;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
