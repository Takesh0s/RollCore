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

    public enum CasterType { FULL, HALF, WARLOCK, NONE }

    /** Maps each class to its caster type — mirrors CLASS_CASTER_TYPE in engine.ts. */
    static final Map<String, CasterType> CLASS_CASTER_TYPE = Map.ofEntries(
        Map.entry("Bárbaro",     CasterType.NONE),
        Map.entry("Bardo",       CasterType.FULL),
        Map.entry("Clérigo",     CasterType.FULL),
        Map.entry("Druida",      CasterType.FULL),
        Map.entry("Feiticeiro",  CasterType.FULL),
        Map.entry("Guerreiro",   CasterType.NONE),
        Map.entry("Ladino",      CasterType.NONE),
        Map.entry("Mago",        CasterType.FULL),
        Map.entry("Monge",       CasterType.NONE),
        Map.entry("Paladino",    CasterType.HALF),
        Map.entry("Patrulheiro", CasterType.HALF),
        Map.entry("Warlock",     CasterType.WARLOCK)
    );

    /** Spellcasting ability by class — PHB Ch.3 / CLASS_SPELL_ABILITY in engine.ts. */
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

    /** Warlock Pact Magic {total, slotLevel} — mirrors WARLOCK_TABLE in engine.ts (PHB p.107). */
    static final int[][] WARLOCK_TABLE = {
        {1,1},{2,1},{2,2},{2,2},
        {2,3},{2,3},{2,4},{2,4},
        {2,5},{2,5},{3,5},{3,5},
        {3,5},{3,5},{3,5},{3,5},
        {4,5},{4,5},{4,5},{4,5}
    };

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
     * Returns spell slot counts (levels 1–9) for full/half casters.
     * Returns null for non-casters and warlocks (use {@link #getWarlockSlots}).
     * Mirrors getMaxSpellSlots() in engine.ts.
     */
    public Map<String, Integer> getMaxSpellSlots(String className, int level) {
        CasterType type = CLASS_CASTER_TYPE.getOrDefault(className, CasterType.NONE);
        int[][] table = switch (type) {
            case FULL -> FULL_CASTER_SLOTS;
            case HALF -> HALF_CASTER_SLOTS;
            default   -> null;
        };
        if (table == null) return null;

        int[] row = table[Math.min(level, 20) - 1];
        Map<String, Integer> slots = new LinkedHashMap<>();
        for (int i = 0; i < 9; i++) {
            slots.put(String.valueOf(i + 1), row[i]);
        }
        return slots;
    }

    /**
     * Returns Warlock Pact Magic {total, level, used} or null for non-warlocks.
     * Mirrors getWarlockSlots() in engine.ts.
     */
    public Map<String, Integer> getWarlockSlots(String className, int level) {
        if (CLASS_CASTER_TYPE.getOrDefault(className, CasterType.NONE) != CasterType.WARLOCK) {
            return null;
        }
        int[] row = WARLOCK_TABLE[Math.min(level, 20) - 1];
        return Map.of("total", row[0], "level", row[1], "used", 0);
    }

    // ── Spell Stats ───────────────────────────────────────────────────────────

    /**
     * Spell save DC — PHB p.205.
     * Formula: 8 + proficiency bonus + spellcasting ability modifier.
     * Returns null for non-casters.
     * Mirrors getSpellSaveDC() in engine.ts.
     */
    public Integer getSpellSaveDC(String className, int level, Map<String, Integer> attrs) {
        String ability = CLASS_SPELL_ABILITY.get(className);
        if (ability == null) return null;
        return 8 + profBonus(level) + calcMod(attrs.getOrDefault(ability, 10));
    }

    /**
     * Spell attack bonus — PHB p.205.
     * Formula: proficiency bonus + spellcasting ability modifier.
     * Returns null for non-casters.
     * Mirrors getSpellAttackBonus() in engine.ts.
     */
    public Integer getSpellAttackBonus(String className, int level, Map<String, Integer> attrs) {
        String ability = CLASS_SPELL_ABILITY.get(className);
        if (ability == null) return null;
        return profBonus(level) + calcMod(attrs.getOrDefault(ability, 10));
    }

    // ── Validation helpers ────────────────────────────────────────────────────

    public boolean isValidClass(String className) {
        return CLASSES.contains(className);
    }

    public boolean isValidRace(String raceName) {
        return RACES.contains(raceName);
    }
}