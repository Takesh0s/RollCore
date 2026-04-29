package com.rollcore.service;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Server-side D&D 5e rules engine.
 *
 * <p>Mirrors {@code src/lib/engine.ts} exactly so all game-rule calculations
 * are authoritative on the backend and cannot be manipulated client-side.
 * Arquitetura §5.1.2 (engine package) / §4.1 (UC-02 impact).
 * All data sourced from the D&D 5e SRD (CC BY 4.0).
 *
 * <p>This class has no Spring/framework dependencies in its computation methods
 * so it can be unit-tested without an application context.
 */
@Component
public class DndEngine {

    // ── Constants ─────────────────────────────────────────────────────────────

    public static final List<String> CLASSES = List.of(
        "Bárbaro", "Bardo", "Clérigo", "Druida", "Feiticeiro",
        "Guerreiro", "Ladino", "Mago", "Monge", "Paladino",
        "Patrulheiro", "Warlock"
    );

    public static final List<String> RACES = List.of(
        "Anão", "Draconato", "Elfo", "Gnomo", "Halfling",
        "Humano", "Meio-Elfo", "Meio-Orc", "Tiefling"
    );

    /**
     * Caster types — mirrors CasterType in engine.ts.
     * THIRD = 1/3 caster (Cavaleiro Arcano / Trapaceiro Arcano, PHB p.85/p.92).
     */
    public enum CasterType { FULL, HALF, THIRD, WARLOCK, NONE }

    /** Base caster type by class — mirrors CLASS_CASTER_TYPE in engine.ts. */
    static final Map<String, CasterType> CLASS_CASTER_TYPE = Map.ofEntries(
        Map.entry("Bárbaro",     CasterType.NONE),
        Map.entry("Bardo",       CasterType.FULL),
        Map.entry("Clérigo",     CasterType.FULL),
        Map.entry("Druida",      CasterType.FULL),
        Map.entry("Feiticeiro",  CasterType.FULL),
        Map.entry("Guerreiro",   CasterType.NONE),   // overridden by Cavaleiro Arcano
        Map.entry("Ladino",      CasterType.NONE),   // overridden by Trapaceiro Arcano
        Map.entry("Mago",        CasterType.FULL),
        Map.entry("Monge",       CasterType.NONE),   // Via dos Quatro Elementos uses Ki, not slots
        Map.entry("Paladino",    CasterType.HALF),
        Map.entry("Patrulheiro", CasterType.HALF),
        Map.entry("Warlock",     CasterType.WARLOCK)
    );

    /**
     * Subclasses that override the base class caster type — mirrors
     * SUBCLASS_CASTER_TYPE in engine.ts (PHB p.85/p.92).
     */
    static final Map<String, CasterType> SUBCLASS_CASTER_TYPE = Map.of(
        "Cavaleiro Arcano", CasterType.THIRD,   // Guerreiro subclass — INT, 1/3 caster
        "Trapaceiro Arcano", CasterType.THIRD   // Ladino subclass  — INT, 1/3 caster
    );

    /** Spellcasting ability by class — mirrors CLASS_SPELL_ABILITY in engine.ts. */
    static final Map<String, String> CLASS_SPELL_ABILITY = Map.of(
        "Bardo",       "CHA",
        "Clérigo",     "WIS",
        "Druida",      "WIS",
        "Feiticeiro",  "CHA",
        "Mago",        "INT",
        "Paladino",    "CHA",
        "Patrulheiro", "WIS",
        "Warlock",     "CHA"
    );

    /**
     * Spellcasting ability for subclasses that grant spellcasting.
     * Mirrors SUBCLASS_CASTER_TYPE.ability in engine.ts.
     */
    static final Map<String, String> SUBCLASS_SPELL_ABILITY = Map.of(
        "Cavaleiro Arcano",  "INT",
        "Trapaceiro Arcano", "INT"
    );

    // ── Spell slot tables (indices 0–19 = levels 1–20) ────────────────────────

    /** Full-caster slots — mirrors FULL_CASTER_SLOTS in engine.ts (PHB Ch.3). */
    static final int[][] FULL_CASTER_SLOTS = {
        {2,0,0,0,0,0,0,0,0},{3,0,0,0,0,0,0,0,0},{4,2,0,0,0,0,0,0,0},
        {4,3,0,0,0,0,0,0,0},{4,3,2,0,0,0,0,0,0},{4,3,3,0,0,0,0,0,0},
        {4,3,3,1,0,0,0,0,0},{4,3,3,2,0,0,0,0,0},{4,3,3,3,1,0,0,0,0},
        {4,3,3,3,2,0,0,0,0},{4,3,3,3,2,1,0,0,0},{4,3,3,3,2,1,0,0,0},
        {4,3,3,3,2,1,1,0,0},{4,3,3,3,2,1,1,0,0},{4,3,3,3,2,1,1,1,0},
        {4,3,3,3,2,1,1,1,0},{4,3,3,3,2,1,1,1,1},{4,3,3,3,3,1,1,1,1},
        {4,3,3,3,3,2,1,1,1},{4,3,3,3,3,2,2,1,1}
    };

    /** Half-caster slots (Paladino/Patrulheiro) — mirrors HALF_CASTER_SLOTS in engine.ts. */
    static final int[][] HALF_CASTER_SLOTS = {
        {0,0,0,0,0,0,0,0,0},{2,0,0,0,0,0,0,0,0},{3,0,0,0,0,0,0,0,0},
        {3,0,0,0,0,0,0,0,0},{4,2,0,0,0,0,0,0,0},{4,2,0,0,0,0,0,0,0},
        {4,3,0,0,0,0,0,0,0},{4,3,0,0,0,0,0,0,0},{4,3,2,0,0,0,0,0,0},
        {4,3,2,0,0,0,0,0,0},{4,3,3,0,0,0,0,0,0},{4,3,3,0,0,0,0,0,0},
        {4,3,3,1,0,0,0,0,0},{4,3,3,1,0,0,0,0,0},{4,3,3,2,0,0,0,0,0},
        {4,3,3,2,0,0,0,0,0},{4,3,3,3,1,0,0,0,0},{4,3,3,3,1,0,0,0,0},
        {4,3,3,3,2,0,0,0,0},{4,3,3,3,2,0,0,0,0}
    };

    /**
     * Third-caster slots (Cavaleiro Arcano / Trapaceiro Arcano).
     * No slots at levels 1–2; starts at level 3. Max 4th-level slots at level 19+.
     * Mirrors THIRD_CASTER_SLOTS in engine.ts (PHB p.85/p.92).
     */
    static final int[][] THIRD_CASTER_SLOTS = {
        {0,0,0,0,0,0,0,0,0},{0,0,0,0,0,0,0,0,0},{2,0,0,0,0,0,0,0,0},
        {3,0,0,0,0,0,0,0,0},{3,0,0,0,0,0,0,0,0},{3,0,0,0,0,0,0,0,0},
        {4,2,0,0,0,0,0,0,0},{4,2,0,0,0,0,0,0,0},{4,2,0,0,0,0,0,0,0},
        {4,3,0,0,0,0,0,0,0},{4,3,0,0,0,0,0,0,0},{4,3,0,0,0,0,0,0,0},
        {4,3,2,0,0,0,0,0,0},{4,3,2,0,0,0,0,0,0},{4,3,2,0,0,0,0,0,0},
        {4,3,3,0,0,0,0,0,0},{4,3,3,0,0,0,0,0,0},{4,3,3,0,0,0,0,0,0},
        {4,3,3,1,0,0,0,0,0},{4,3,3,1,0,0,0,0,0}
    };

    /** Warlock Pact Magic {total, slotLevel} — mirrors WARLOCK_TABLE in engine.ts (PHB p.107). */
    static final int[][] WARLOCK_TABLE = {
        {1,1},{2,1},{2,2},{2,2},
        {2,3},{2,3},{2,4},{2,4},
        {2,5},{2,5},{3,5},{3,5},
        {3,5},{3,5},{3,5},{3,5},
        {4,5},{4,5},{4,5},{4,5}
    };

    // ── Caster type resolution ────────────────────────────────────────────────

    /**
     * Resolves the effective CasterType for a class+subclass combination.
     * Subclass overrides base class when it grants spellcasting.
     * Mirrors resolveCasterType() in engine.ts.
     */
    public CasterType resolveCasterType(String className, String subclass) {
        if (subclass != null && !subclass.isBlank() && SUBCLASS_CASTER_TYPE.containsKey(subclass)) {
            return SUBCLASS_CASTER_TYPE.get(subclass);
        }
        return CLASS_CASTER_TYPE.getOrDefault(className, CasterType.NONE);
    }

    /**
     * Resolves the spellcasting ability for a class+subclass combination.
     * Returns null for non-casters.
     * Mirrors resolveSpellAbility() in engine.ts.
     */
    public String resolveSpellAbility(String className, String subclass) {
        if (subclass != null && !subclass.isBlank() && SUBCLASS_SPELL_ABILITY.containsKey(subclass)) {
            return SUBCLASS_SPELL_ABILITY.get(subclass);
        }
        return CLASS_SPELL_ABILITY.get(className);
    }

    // ── Core Calculations ─────────────────────────────────────────────────────

    /**
     * D&D 5e attribute modifier — UC-02 RN-02.
     * Formula: floor((value − 10) / 2) — mirrors calcMod() in engine.ts.
     */
    public int calcMod(int value) {
        return (int) Math.floor((value - 10) / 2.0);
    }

    /**
     * Proficiency bonus by level — UC-02 RN-03.
     * 1–4→+2 | 5–8→+3 | 9–12→+4 | 13–16→+5 | 17–20→+6
     * Mirrors profBonus() in engine.ts.
     */
    public int profBonus(int level) {
        if (level <= 4)  return 2;
        if (level <= 8)  return 3;
        if (level <= 12) return 4;
        if (level <= 16) return 5;
        return 6;
    }

    // ── Spell Slots ───────────────────────────────────────────────────────────

    /**
     * Returns spell slot counts (levels 1–9) for a class+subclass at a given level.
     * Returns null for non-casters and warlocks (use {@link #getWarlockSlots}).
     * Returns null for third-casters below level 3 (no slots yet).
     * Mirrors getMaxSpellSlots() in engine.ts.
     */
    public Map<String, Integer> getMaxSpellSlots(String className, int level, String subclass) {
        CasterType type = resolveCasterType(className, subclass);
        int[][] table = switch (type) {
            case FULL  -> FULL_CASTER_SLOTS;
            case HALF  -> HALF_CASTER_SLOTS;
            case THIRD -> THIRD_CASTER_SLOTS;
            default    -> null;
        };
        if (table == null) return null;

        int[] row = table[Math.min(level, 20) - 1];

        // For THIRD casters (Cavaleiro Arcano / Trapaceiro Arcano), return null
        // when there are no slots yet (levels 1–2) — mirrors engine.ts behaviour.
        // FULL and HALF casters return the map even when all values are zero
        // (e.g. Paladino level 1), so the UI can distinguish "has table, 0 slots"
        // from "no spellcasting at all".
        if (type == CasterType.THIRD) {
            boolean allZero = true;
            for (int v : row) { if (v > 0) { allZero = false; break; } }
            if (allZero) return null;
        }

        Map<String, Integer> slots = new LinkedHashMap<>();
        for (int i = 0; i < 9; i++) {
            slots.put(String.valueOf(i + 1), row[i]);
        }
        return slots;
    }

    /**
     * Backwards-compatible overload — treats subclass as empty.
     * Used internally where subclass is not available.
     */
    public Map<String, Integer> getMaxSpellSlots(String className, int level) {
        return getMaxSpellSlots(className, level, null);
    }

    /**
     * Returns Warlock Pact Magic {total, level, used} or null for non-warlocks.
     * Mirrors getWarlockSlots() in engine.ts.
     */
    public Map<String, Integer> getWarlockSlots(String className, int level, String subclass) {
        if (resolveCasterType(className, subclass) != CasterType.WARLOCK) return null;
        int[] row = WARLOCK_TABLE[Math.min(level, 20) - 1];
        return Map.of("total", row[0], "level", row[1], "used", 0);
    }

    /** Backwards-compatible overload. */
    public Map<String, Integer> getWarlockSlots(String className, int level) {
        return getWarlockSlots(className, level, null);
    }

    // ── Spell Stats ───────────────────────────────────────────────────────────

    /**
     * Spell save DC — PHB p.205.
     * Formula: 8 + proficiency bonus + spellcasting ability modifier.
     * Returns null for non-casters.
     * Mirrors getSpellSaveDC() in engine.ts.
     */
    public Integer getSpellSaveDC(String className, int level, Map<String, Integer> attrs, String subclass) {
        String ability = resolveSpellAbility(className, subclass);
        if (ability == null) return null;
        return 8 + profBonus(level) + calcMod(attrs.getOrDefault(ability, 10));
    }

    public Integer getSpellSaveDC(String className, int level, Map<String, Integer> attrs) {
        return getSpellSaveDC(className, level, attrs, null);
    }

    /**
     * Spell attack bonus — PHB p.205.
     * Formula: proficiency bonus + spellcasting ability modifier.
     * Returns null for non-casters.
     * Mirrors getSpellAttackBonus() in engine.ts.
     */
    public Integer getSpellAttackBonus(String className, int level, Map<String, Integer> attrs, String subclass) {
        String ability = resolveSpellAbility(className, subclass);
        if (ability == null) return null;
        return profBonus(level) + calcMod(attrs.getOrDefault(ability, 10));
    }

    public Integer getSpellAttackBonus(String className, int level, Map<String, Integer> attrs) {
        return getSpellAttackBonus(className, level, attrs, null);
    }

    // ── Validation helpers ────────────────────────────────────────────────────

    public boolean isValidClass(String className) {
        return CLASSES.contains(className);
    }

    public boolean isValidRace(String raceName) {
        return RACES.contains(raceName);
    }
}