package com.rollcore.dto.response;

import com.rollcore.entity.Character;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Character sheet payload returned to the client — UC-02.
 * Maps directly from the {@link Character} entity.
 */
public record CharacterResponse(
    UUID                    id,
    String                  name,
    String                  characterClass,
    String                  subclass,
    String                  race,
    int                     level,
    Map<String, Integer>    attributes,
    int                     hp,
    int                     maxHp,
    int                     tempHp,
    int                     ac,
    Map<String, Integer>    spellSlots,
    Map<String, Integer>    warlockSlots,
    Instant                 createdAt,
    Instant                 updatedAt
) {
    /** Factory method — keeps controllers free of mapping code. */
    public static CharacterResponse from(Character c) {
        return new CharacterResponse(
            c.getId(),
            c.getName(),
            c.getCharacterClass(),
            c.getSubclass(),
            c.getRace(),
            c.getLevel(),
            c.getAttributes(),
            c.getHp(),
            c.getMaxHp(),
            c.getTempHp(),
            c.getAc(),
            c.getSpellSlots(),
            c.getWarlockSlots(),
            c.getCreatedAt(),
            c.getUpdatedAt()
        );
    }
}