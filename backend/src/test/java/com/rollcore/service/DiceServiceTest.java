package com.rollcore.service;

import com.rollcore.dto.request.RollRequest;
import com.rollcore.dto.response.RollResponse;
import com.rollcore.entity.DiceRoll;
import com.rollcore.entity.User;
import com.rollcore.exception.InvalidFormulaException;
import com.rollcore.repository.DiceRollRepository;
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
}