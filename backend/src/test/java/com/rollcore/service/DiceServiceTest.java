package com.rollcore.service;

import com.rollcore.dto.request.RollRequest;
import com.rollcore.dto.response.RollResponse;
import com.rollcore.entity.DiceRoll;
import com.rollcore.entity.GameTable;
import com.rollcore.entity.User;
import com.rollcore.exception.InvalidFormulaException;
import com.rollcore.repository.DiceRollRepository;
import com.rollcore.repository.GameTableRepository;
import com.rollcore.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link DiceService}.
 * All external dependencies (repositories) are mocked — no Spring context needed.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DiceService")
class DiceServiceTest {

    @Mock  DiceRollRepository diceRollRepository;
    @Mock  UserRepository     userRepository;
    @Mock  GameTableRepository gameTableRepository;
    @InjectMocks DiceService  diceService;

    private final UUID   userId = UUID.randomUUID();
    private       User   user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(userId)
                .email("test@rollcore.com")
                .username("testuser")
                .passwordHash("hash")
                .build();
    }

    // ── roll — valid formulas ─────────────────────────────────────────────────

    @Nested
    @DisplayName("roll() — valid formulas")
    class RollValidTest {

        @Test
        @DisplayName("2d6+3 → persists roll and returns correct structure")
        void rollFormula2d6plus3() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(diceRollRepository.save(any())).thenAnswer(inv -> {
                DiceRoll r = inv.getArgument(0);
                r = DiceRoll.builder()
                        .id(UUID.randomUUID())
                        .user(r.getUser())
                        .formula(r.getFormula())
                        .individualResults(r.getIndividualResults())
                        .total(r.getTotal())
                        .rolledAt(Instant.now())
                        .build();
                return r;
            });

            RollResponse response = diceService.roll(userId, new RollRequest("2d6+3"));

            assertThat(response.formula()).isEqualTo("2d6+3");
            assertThat(response.rolls()).hasSize(2);
            assertThat(response.rolls()).allMatch(v -> v >= 1 && v <= 6);
            assertThat(response.mod()).isEqualTo(3);
            assertThat(response.total()).isEqualTo(
                    response.rolls().stream().mapToInt(Integer::intValue).sum() + 3);

            // Verify one save call with correct data
            ArgumentCaptor<DiceRoll> captor = ArgumentCaptor.forClass(DiceRoll.class);
            verify(diceRollRepository).save(captor.capture());
            assertThat(captor.getValue().getFormula()).isEqualTo("2d6+3");
        }

        @ParameterizedTest(name = "formula={0}")
        @ValueSource(strings = {"1d20", "4d4-1", "1d100", "99d4+99"})
        @DisplayName("Various valid formulas are accepted")
        void validFormulas(String formula) {
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(diceRollRepository.save(any())).thenAnswer(inv -> {
                DiceRoll r = inv.getArgument(0);
                // Simulate what the DB does: assign a generated UUID
                return DiceRoll.builder()
                        .id(UUID.randomUUID())
                        .user(r.getUser())
                        .formula(r.getFormula())
                        .individualResults(r.getIndividualResults())
                        .total(r.getTotal())
                        .rolledAt(Instant.now())
                        .build();
            });

            RollResponse response = diceService.roll(userId, new RollRequest(formula));

            assertThat(response.formula()).isEqualTo(formula);
            assertThat(response.id()).isNotNull();
        }

        // CT-DICE-16 — HU-03
        @Test
        @DisplayName("CT-DICE-16 | 1d8-2 → mod=-2, total = roll - 2 (negative modifier path)")
        void rollFormulaNegativeMod() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(diceRollRepository.save(any())).thenAnswer(inv -> {
                DiceRoll r = inv.getArgument(0);
                return DiceRoll.builder()
                        .id(UUID.randomUUID())
                        .user(r.getUser())
                        .formula(r.getFormula())
                        .individualResults(r.getIndividualResults())
                        .total(r.getTotal())
                        .rolledAt(Instant.now())
                        .build();
            });

            RollResponse response = diceService.roll(userId, new RollRequest("1d8-2"));

            assertThat(response.formula()).isEqualTo("1d8-2");
            assertThat(response.rolls()).hasSize(1);
            assertThat(response.rolls().get(0)).isBetween(1, 8);
            assertThat(response.mod()).isEqualTo(-2);
            // Total must equal the single die result minus the modifier
            assertThat(response.total()).isEqualTo(response.rolls().get(0) - 2);
        }

        // CT-DICE-17 — HU-03
        @Test
        @DisplayName("CT-DICE-17 | 1d4 result is always between 1 and 4 in 100 iterations (SecureRandom bounds)")
        void d4BoundsCheck() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(diceRollRepository.save(any())).thenAnswer(inv -> {
                DiceRoll r = inv.getArgument(0);
                return DiceRoll.builder()
                        .id(UUID.randomUUID()).user(r.getUser()).formula(r.getFormula())
                        .individualResults(r.getIndividualResults()).total(r.getTotal())
                        .rolledAt(Instant.now()).build();
            });

            // Roll 100 times — validates SecureRandom ceiling for the smallest standard die
            for (int i = 0; i < 100; i++) {
                RollResponse r = diceService.roll(userId, new RollRequest("1d4"));
                assertThat(r.total()).isBetween(1, 4);
            }
        }

        @Test
        @DisplayName("1d20 result is always between 1 and 20 (SecureRandom bounds)")
        void d20BoundsCheck() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(diceRollRepository.save(any())).thenAnswer(inv -> {
                DiceRoll r = inv.getArgument(0);
                return DiceRoll.builder()
                        .id(UUID.randomUUID()).user(r.getUser()).formula(r.getFormula())
                        .individualResults(r.getIndividualResults()).total(r.getTotal())
                        .rolledAt(Instant.now()).build();
            });

            // Roll 100 times to check bounds statistically
            for (int i = 0; i < 100; i++) {
                RollResponse r = diceService.roll(userId, new RollRequest("1d20"));
                assertThat(r.total()).isBetween(1, 20);
            }
        }
    }

    // ── roll — invalid formulas ───────────────────────────────────────────────

    @Nested
    @DisplayName("roll() — invalid formulas throw InvalidFormulaException — UC-03 E01")
    class RollInvalidTest {

        @ParameterizedTest(name = "formula=\"{0}\"")
        @ValueSource(strings = {"2d7", "0d6", "abc", "d20", "2d", "2d6+", "100d6"})
        void invalidFormulas(String formula) {
            assertThatThrownBy(() -> diceService.roll(userId, new RollRequest(formula)))
                    .isInstanceOf(InvalidFormulaException.class);

            verifyNoInteractions(diceRollRepository);
        }
    }

    // ── getHistory ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getHistory returns last 50 rolls mapped to RollResponse")
    void getHistoryReturnsRolls() {
        DiceRoll roll = DiceRoll.builder()
                .id(UUID.randomUUID())
                .user(user)
                .formula("1d20")
                .individualResults(List.of(15))
                .total(15)
                .rolledAt(Instant.now())
                .build();

        when(diceRollRepository.findByUserIdOrderByRolledAtDesc(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(roll)));

        List<RollResponse> history = diceService.getHistory(userId);

        assertThat(history).hasSize(1);
        assertThat(history.get(0).formula()).isEqualTo("1d20");
        assertThat(history.get(0).total()).isEqualTo(15);
    }

    @Test
    @DisplayName("getHistory returns empty list when no rolls exist")
    void getHistoryEmpty() {
        when(diceRollRepository.findByUserIdOrderByRolledAtDesc(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        assertThat(diceService.getHistory(userId)).isEmpty();
    }

    // ── label and mode (Dados screen) ─────────────────────────────────────────

    private void stubSave() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(diceRollRepository.save(any())).thenAnswer(inv -> {
            DiceRoll r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });
    }

    @Test
    @DisplayName("roll stores a trimmed label and treats a blank one as none")
    void rollStoresTrimmedLabel() {
        stubSave();

        RollResponse labelled = diceService.roll(userId,
                new RollRequest("1d20+5", "  Ataque com espada longa  ", null));
        RollResponse blank = diceService.roll(userId, new RollRequest("1d20", "   ", null));

        assertThat(labelled.label()).isEqualTo("Ataque com espada longa");
        assertThat(labelled.mode()).isEqualTo("normal");
        assertThat(blank.label()).isNull();
        assertThat(labelled.discardedRolls()).isNull();
    }

    @Test
    @DisplayName("advantage keeps the higher set and discards the lower one")
    void advantageKeepsHigher() {
        stubSave();

        for (int i = 0; i < 100; i++) {
            RollResponse r = diceService.roll(userId, new RollRequest("1d20", null, "advantage"));
            assertThat(r.mode()).isEqualTo("advantage");
            assertThat(r.discardedRolls()).hasSize(1);
            assertThat(r.rolls().get(0)).isGreaterThanOrEqualTo(r.discardedRolls().get(0));
            assertThat(r.total()).isEqualTo(r.rolls().get(0));
        }
    }

    @Test
    @DisplayName("disadvantage keeps the lower set and discards the higher one")
    void disadvantageKeepsLower() {
        stubSave();

        for (int i = 0; i < 100; i++) {
            RollResponse r = diceService.roll(userId, new RollRequest("1d20+2", null, "disadvantage"));
            assertThat(r.mode()).isEqualTo("disadvantage");
            assertThat(r.rolls().get(0)).isLessThanOrEqualTo(r.discardedRolls().get(0));
            assertThat(r.total()).isEqualTo(r.rolls().get(0) + 2);
        }
    }

    @Test
    @DisplayName("an unknown mode falls back to a normal roll")
    void unknownModeIsNormal() {
        stubSave();

        RollResponse r = diceService.roll(userId, new RollRequest("1d6", null, "whatever"));

        assertThat(r.mode()).isEqualTo("normal");
        assertThat(r.discardedRolls()).isNull();
    }

    @Test
    @DisplayName("rollInTable records the table id on the roll")
    void rollInTableRecordsTable() {
        stubSave();
        UUID tableId = UUID.randomUUID();

        RollResponse r = diceService.rollInTable(userId, tableId, new RollRequest("1d8"));

        assertThat(r.tableId()).isEqualTo(tableId);
        ArgumentCaptor<DiceRoll> saved = ArgumentCaptor.forClass(DiceRoll.class);
        verify(diceRollRepository).save(saved.capture());
        assertThat(saved.getValue().getGameTableId()).isEqualTo(tableId);
    }

    @Test
    @DisplayName("getHistory(userId, tableId) filters by table and resolves its name")
    void getHistoryByTableResolvesName() {
        UUID tableId = UUID.randomUUID();
        DiceRoll roll = DiceRoll.builder()
                .id(UUID.randomUUID()).user(user).gameTableId(tableId)
                .formula("1d20+7").individualResults(List.of(13)).total(20)
                .label("Ataque").mode("advantage").discardedResults(List.of(4))
                .rolledAt(Instant.now()).build();
        GameTable table = GameTable.builder().id(tableId).name("Cripta").build();

        when(diceRollRepository.findByUserIdAndGameTableIdOrderByRolledAtDesc(
                eq(userId), eq(tableId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(roll)));
        when(gameTableRepository.findAllById(any())).thenReturn(List.of(table));

        List<RollResponse> history = diceService.getHistory(userId, tableId);

        assertThat(history).hasSize(1);
        RollResponse r = history.get(0);
        assertThat(r.tableId()).isEqualTo(tableId);
        assertThat(r.tableName()).isEqualTo("Cripta");
        assertThat(r.label()).isEqualTo("Ataque");
        assertThat(r.mode()).isEqualTo("advantage");
        assertThat(r.discardedRolls()).containsExactly(4);
        assertThat(r.mod()).isEqualTo(7);
    }

    @Test
    @DisplayName("getHistory leaves tableName null for solo rolls and does not query tables")
    void getHistorySoloRollNoTableLookup() {
        DiceRoll roll = DiceRoll.builder()
                .id(UUID.randomUUID()).user(user).formula("1d6")
                .individualResults(List.of(3)).total(3).rolledAt(Instant.now()).build();
        when(diceRollRepository.findByUserIdOrderByRolledAtDesc(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(roll)));

        List<RollResponse> history = diceService.getHistory(userId);

        assertThat(history.get(0).tableName()).isNull();
        verifyNoInteractions(gameTableRepository);
    }
}
