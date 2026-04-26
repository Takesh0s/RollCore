package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Join table entity: which spells a character knows/has prepared.
 * Mirrors the character_spells table — V3__spells_schema.sql / Sprint 8.
 */
@Entity
@Table(name = "character_spells")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CharacterSpell {

    @EmbeddedId
    private CharacterSpellId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("characterId")
    @JoinColumn(name = "character_id")
    private Character character;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("spellId")
    @JoinColumn(name = "spell_id")
    private Spell spell;

    @Column(name = "is_prepared", nullable = false)
    @Builder.Default
    private boolean prepared = true;

    @Column(nullable = false)
    @Builder.Default
    private short position = 0;

    @Column(name = "added_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant addedAt = Instant.now();
}