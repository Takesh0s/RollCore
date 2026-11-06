package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * One item stack in a character's inventory — migration V13.
 * {@code weight} is per unit, in kg.
 */
@Entity
@Table(name = "character_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CharacterItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "character_id", nullable = false)
    private Character character;

    @Column(nullable = false, length = 80)
    private String name;

    /** weapon | armor | consumable | other. */
    @Column(nullable = false, length = 12)
    @Builder.Default
    private String category = "other";

    @Column(nullable = false)
    @Builder.Default
    private int quantity = 1;

    @Column(nullable = false, precision = 7, scale = 2)
    @Builder.Default
    private BigDecimal weight = BigDecimal.ZERO;

    /** Damage or armor class text, e.g. "1D8 Cort." or "11 + Dex CA". */
    @Column(length = 40)
    private String damage;

    @Column(length = 500)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
