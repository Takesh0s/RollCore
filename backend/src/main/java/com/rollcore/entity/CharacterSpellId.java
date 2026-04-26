package com.rollcore.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

/** Composite primary key for the character_spells join table. */
@Embeddable
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode
public class CharacterSpellId implements Serializable {

    @Column(name = "character_id")
    private UUID characterId;

    @Column(name = "spell_id")
    private UUID spellId;
}