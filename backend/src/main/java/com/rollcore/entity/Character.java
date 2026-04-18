package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * D&D 5e character sheet.
 * Mirrors the {@code characters} table — Arquitetura §6.4 / UC-02.
 *
 * <p>{@code attributes} is JSONB (Arquitetura §6.3): stores {STR,DEX,CON,INT,WIS,CHA}
 * and is designed for extensibility to other RPG systems (Fase 3).
 *
 * <p>{@code spellSlots} / {@code warlockSlots} are populated by {@link com.rollcore.service.DndEngine}
 * server-side — never trusted from the client.
 */
@Entity
@Table(name = "characters")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Character {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    /** D&D 5e class — validated against DndEngine.CLASSES. */
    @Column(name = "class", nullable = false, length = 50)
    private String characterClass;

    /**
     * Chosen subclass, empty string until required level — Sprint 6.
     * Mirrors Character.subclass in types/index.ts.
     */
    @Column(nullable = false, length = 100)
    @Builder.Default
    private String subclass = "";

    /** D&D 5e race — validated against DndEngine.RACES. */
    @Column(nullable = false, length = 50)
    private String race;

    /** Level 1–20 — CHECK constraint in schema. */
    @Column(nullable = false)
    private int level;

    /**
     * Core six attributes as JSONB: {STR, DEX, CON, INT, WIS, CHA}.
     * Post-bonus values (racial bonuses already applied by the frontend).
     * GIN-indexed for future queries — Arquitetura §6.3.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Integer> attributes;

    /** Current HP — tracked live during combat via PATCH. */
    @Column(nullable = false)
    private int hp;

    /** Maximum HP — set on create/edit. */
    @Column(name = "max_hp", nullable = false)
    private int maxHp;

    /**
     * Temporary HP — absorbed before regular HP (PHB p.198 / Sprint 6).
     * Takes the higher of current vs incoming; does not stack.
     */
    @Column(name = "temp_hp", nullable = false)
    @Builder.Default
    private int tempHp = 0;

    /** Armor Class: 10 + DEX modifier — UC-02 RN-01, computed server-side. */
    @Column(nullable = false)
    @Builder.Default
    private int ac = 10;

    /**
     * Standard spell slots (levels 1–9) as JSONB.
     * Null for non-casters; populated by DndEngine#getMaxSpellSlots.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "spell_slots", columnDefinition = "jsonb")
    private Map<String, Integer> spellSlots;

    /**
     * Warlock Pact Magic: {total, level, used} as JSONB.
     * Null for non-warlocks; populated by DndEngine#getWarlockSlots.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "warlock_slots", columnDefinition = "jsonb")
    private Map<String, Integer> warlockSlots;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
