package com.rollcore.dto.response;

import com.rollcore.entity.Spell;

import java.util.List;
import java.util.UUID;

/**
 * Spell data returned to the frontend.
 * Used by GET /spells and as part of GET /characters/{id}/spells.
 */
public record SpellResponse(
    UUID         id,
    String       name,
    int          level,
    String       school,
    String       castingTime,
    String       range,
    String       components,
    String       duration,
    String       description,
    String       higherLevels,
    List<String> classes,
    boolean      ritual,
    boolean      concentration,
    String       attackType,
    String       damageDice,
    String       damageType,
    String       saveAttribute,
    String       source
) {
    public static SpellResponse from(Spell s) {
        return new SpellResponse(
            s.getId(), s.getName(), s.getLevel(), s.getSchool(),
            s.getCastingTime(), s.getRange(), s.getComponents(), s.getDuration(),
            s.getDescription(), s.getHigherLevels(), s.getClasses(),
            s.isRitual(), s.isConcentration(),
            s.getAttackType(), s.getDamageDice(), s.getDamageType(),
            s.getSaveAttribute(), s.getSource()
        );
    }
}