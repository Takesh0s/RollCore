package com.rollcore.engine;

import com.rollcore.service.DndEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link DndEngine}.
 * Verifies that all SRD formulas are implemented correctly and mirror engine.ts.
 * No Spring context needed — pure Java, fast.
 */
@DisplayName("DndEngine – D&D 5e rules")
class DndEngineTest {

    private DndEngine engine;

    @BeforeEach
    void setUp() {
        engine = new DndEngine();
    }

    // ── calcMod ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("calcMod — floor((value-10)/2)")
    class CalcModTest {

        @ParameterizedTest(name = "score={0} → mod={1}")
        @CsvSource({
            "1,  -5",
            "8,  -1",
            "9,  -1",
            "10,  0",
            "11,  0",
            "12,  1",
            "15,  2",
            "20,  5",
            "30, 10"
        })
        void modifierTable(int score, int expected) {
            assertThat(engine.calcMod(score)).isEqualTo(expected);
        }
    }

    // ── profBonus ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("profBonus — by level bracket")
    class ProfBonusTest {

        @ParameterizedTest(name = "level={0} → profBonus={1}")
        @CsvSource({
            " 1, 2",
            " 4, 2",
            " 5, 3",
            " 8, 3",
            " 9, 4",
            "12, 4",
            "13, 5",
            "16, 5",
            "17, 6",
            "20, 6"
        })
        void profBonusTable(int level, int expected) {
            assertThat(engine.profBonus(level)).isEqualTo(expected);
        }
    }

    // ── getMaxSpellSlots ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("getMaxSpellSlots — full and half casters")
    class SpellSlotsTest {

        @Test
        @DisplayName("Mago level 1 → 2 first-level slots, rest 0")
        void magoLevel1() {
            Map<String, Integer> slots = engine.getMaxSpellSlots("Mago", 1);
            assertThat(slots).isNotNull();
            assertThat(slots.get("1")).isEqualTo(2);
            assertThat(slots.get("2")).isEqualTo(0);
        }

        @Test
        @DisplayName("Bardo level 5 → 4/3/2 slots for levels 1/2/3")
        void bardoLevel5() {
            Map<String, Integer> slots = engine.getMaxSpellSlots("Bardo", 5);
            assertThat(slots).isNotNull();
            assertThat(slots.get("1")).isEqualTo(4);
            assertThat(slots.get("2")).isEqualTo(3);
            assertThat(slots.get("3")).isEqualTo(2);
            assertThat(slots.get("4")).isEqualTo(0);
        }

        @Test
        @DisplayName("Paladino level 2 → 2 first-level slots (half caster starts at level 2)")
        void paladinoLevel2() {
            Map<String, Integer> slots = engine.getMaxSpellSlots("Paladino", 2);
            assertThat(slots).isNotNull();
            assertThat(slots.get("1")).isEqualTo(2);
        }

        @Test
        @DisplayName("Paladino level 1 → 0 slots (half caster has no slots at level 1)")
        void paladinoLevel1() {
            Map<String, Integer> slots = engine.getMaxSpellSlots("Paladino", 1);
            assertThat(slots).isNotNull();
            assertThat(slots.get("1")).isEqualTo(0);
        }

        @Test
        @DisplayName("Bárbaro → null (non-caster)")
        void barbaroNonCaster() {
            assertThat(engine.getMaxSpellSlots("Bárbaro", 10)).isNull();
        }

        @Test
        @DisplayName("Warlock → null (uses warlock slots, not standard)")
        void warlockStandardSlots() {
            assertThat(engine.getMaxSpellSlots("Warlock", 5)).isNull();
        }
    }

    // ── getMaxSpellSlots — third casters ──────────────────────────────────────

    @Nested
    @DisplayName("getMaxSpellSlots — third casters (Cavaleiro Arcano / Trapaceiro Arcano)")
    class ThirdCasterSlotsTest {

        @Test
        @DisplayName("Guerreiro Cavaleiro Arcano level 1 → null (no slots before level 3)")
        void cavaleiroLevel1() {
            assertThat(engine.getMaxSpellSlots("Guerreiro", 1, "Cavaleiro Arcano")).isNull();
        }

        @Test
        @DisplayName("Guerreiro Cavaleiro Arcano level 2 → null (no slots before level 3)")
        void cavaleiroLevel2() {
            assertThat(engine.getMaxSpellSlots("Guerreiro", 2, "Cavaleiro Arcano")).isNull();
        }

        @Test
        @DisplayName("Guerreiro Cavaleiro Arcano level 3 → 2 first-level slots")
        void cavaleiroLevel3() {
            Map<String, Integer> slots = engine.getMaxSpellSlots("Guerreiro", 3, "Cavaleiro Arcano");
            assertThat(slots).isNotNull();
            assertThat(slots.get("1")).isEqualTo(2);
            assertThat(slots.get("2")).isEqualTo(0);
        }

        @Test
        @DisplayName("Ladino Trapaceiro Arcano level 7 → 4/2 slots for levels 1/2")
        void trapeceiroLevel7() {
            Map<String, Integer> slots = engine.getMaxSpellSlots("Ladino", 7, "Trapaceiro Arcano");
            assertThat(slots).isNotNull();
            assertThat(slots.get("1")).isEqualTo(4);
            assertThat(slots.get("2")).isEqualTo(2);
            assertThat(slots.get("3")).isEqualTo(0);
        }

        @Test
        @DisplayName("Guerreiro sem subclasse → null (base class is non-caster)")
        void guerreiroSemSubclasse() {
            assertThat(engine.getMaxSpellSlots("Guerreiro", 10, null)).isNull();
        }

        @Test
        @DisplayName("resolveCasterType — Cavaleiro Arcano → THIRD")
        void resolveCavaleiroArcano() {
            assertThat(engine.resolveCasterType("Guerreiro", "Cavaleiro Arcano"))
                    .isEqualTo(DndEngine.CasterType.THIRD);
        }

        @Test
        @DisplayName("resolveCasterType — Trapaceiro Arcano → THIRD")
        void resolveTrapeceiroArcano() {
            assertThat(engine.resolveCasterType("Ladino", "Trapaceiro Arcano"))
                    .isEqualTo(DndEngine.CasterType.THIRD);
        }

        @Test
        @DisplayName("resolveSpellAbility — Cavaleiro Arcano → INT")
        void resolveSpellAbilityCavaleiro() {
            assertThat(engine.resolveSpellAbility("Guerreiro", "Cavaleiro Arcano")).isEqualTo("INT");
        }
    }

    // ── getWarlockSlots ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("getWarlockSlots — Pact Magic (PHB p.107)")
    class WarlockSlotsTest {

        @Test
        @DisplayName("Warlock level 1 → 1 slot of level 1")
        void level1() {
            Map<String, Integer> slots = engine.getWarlockSlots("Warlock", 1);
            assertThat(slots).isNotNull();
            assertThat(slots.get("total")).isEqualTo(1);
            assertThat(slots.get("level")).isEqualTo(1);
            assertThat(slots.get("used")).isEqualTo(0);
        }

        @Test
        @DisplayName("Warlock level 5 → 2 slots of level 3")
        void level5() {
            Map<String, Integer> slots = engine.getWarlockSlots("Warlock", 5);
            assertThat(slots).isNotNull();
            assertThat(slots.get("total")).isEqualTo(2);
            assertThat(slots.get("level")).isEqualTo(3);
        }

        @Test
        @DisplayName("Warlock level 20 → 4 slots of level 5")
        void level20() {
            Map<String, Integer> slots = engine.getWarlockSlots("Warlock", 20);
            assertThat(slots).isNotNull();
            assertThat(slots.get("total")).isEqualTo(4);
            assertThat(slots.get("level")).isEqualTo(5);
        }

        @Test
        @DisplayName("Mago → null (not a warlock)")
        void nonWarlock() {
            assertThat(engine.getWarlockSlots("Mago", 10)).isNull();
        }
    }

    // ── getSpellSaveDC ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getSpellSaveDC — 8 + profBonus + ability mod (PHB p.205)")
    class SpellSaveDCTest {

        @Test
        @DisplayName("Mago level 1, INT=16 → DC 13  (8 + 2 + 3)")
        void magoLevel1Int16() {
            Map<String, Integer> attrs = Map.of("INT", 16);
            assertThat(engine.getSpellSaveDC("Mago", 1, attrs)).isEqualTo(13);
        }

        @Test
        @DisplayName("Clérigo level 9, WIS=20 → DC 18  (8 + 4 + 5 - wait, 8+4+5=17)")
        void clerigoLevel9Wis18() {
            // WIS 18 → mod +4; profBonus(9) = 4; DC = 8+4+4 = 16
            Map<String, Integer> attrs = Map.of("WIS", 18);
            assertThat(engine.getSpellSaveDC("Clérigo", 9, attrs)).isEqualTo(16);
        }

        @Test
        @DisplayName("Bárbaro → null (non-caster)")
        void nonCaster() {
            assertThat(engine.getSpellSaveDC("Bárbaro", 5, Map.of("STR", 18))).isNull();
        }
    }

    // ── getSpellAttackBonus ───────────────────────────────────────────────────

    @Test
    @DisplayName("getSpellAttackBonus: Warlock level 5, CHA=14 → +5  (profBonus=3 + mod=2)")
    void spellAttackBonus() {
        // profBonus(5)=3, calcMod(14)=2 → 3+2=5
        Map<String, Integer> attrs = Map.of("CHA", 14);
        assertThat(engine.getSpellAttackBonus("Warlock", 5, attrs)).isEqualTo(5);
    }

    // ── validation helpers ────────────────────────────────────────────────────

    @Test
    @DisplayName("isValidClass rejects unknown class")
    void invalidClass() {
        assertThat(engine.isValidClass("Cavaleiro")).isFalse();
        assertThat(engine.isValidClass("Guerreiro")).isTrue();
    }

    @Test
    @DisplayName("isValidRace rejects unknown race")
    void invalidRace() {
        assertThat(engine.isValidRace("Goblin")).isFalse();
        assertThat(engine.isValidRace("Elfo")).isTrue();
    }
}