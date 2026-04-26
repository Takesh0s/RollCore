package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

/**
 * SRD D&D 5e spell from the master catalog.
 * Seeded by V4__seed_spells.sql — data from Livro do Jogador (SRD CC BY 4.0).
 * Sprint 8 / Arquitetura §6.4.
 */
@Entity
@Table(name = "spells")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Spell {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    /** 0 = truque, 1–9 = spell level. */
    @Column(nullable = false)
    private int level;

    @Column(nullable = false, length = 30)
    private String school;

    @Column(name = "casting_time", nullable = false, length = 80)
    private String castingTime;

    @Column(nullable = false, length = 80)
    private String range;

    @Column(nullable = false, length = 120)
    private String components;

    @Column(nullable = false, length = 80)
    private String duration;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** "Em Níveis Superiores…" text — null for spells that don't scale. */
    @Column(name = "higher_levels", columnDefinition = "TEXT")
    private String higherLevels;

    /**
     * Classes that have this spell in their list — stored as PostgreSQL TEXT[].
     * Queried via GIN index for class-filter endpoint.
     */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]", nullable = false)
    private List<String> classes;

    @Column(nullable = false)
    private boolean ritual;

    @Column(nullable = false)
    private boolean concentration;

    /** 'ranged' | 'melee' | null — null for non-attack spells. */
    @Column(name = "attack_type", length = 20)
    private String attackType;

    /** e.g. "8d6" — null for utility/buff spells. */
    @Column(name = "damage_dice", length = 20)
    private String damageDice;

    /** e.g. "Fogo", "Necrótico" — null for non-damage spells. */
    @Column(name = "damage_type", length = 30)
    private String damageType;

    /** Saving throw attribute if spell requires one — STR/DEX/CON/INT/WIS/CHA or null. */
    @Column(name = "save_attribute", length = 3)
    private String saveAttribute;

    @Column(nullable = false, length = 60)
    @Builder.Default
    private String source = "Livro do Jogador";
}