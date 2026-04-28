package com.rollcore.service;

import com.rollcore.dto.request.RollRequest;
import com.rollcore.dto.request.SaveRollRequest;
import com.rollcore.dto.response.RollResponse;
import com.rollcore.entity.DiceRoll;
import com.rollcore.entity.User;
import com.rollcore.exception.InvalidFormulaException;
import com.rollcore.repository.DiceRollRepository;
import com.rollcore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Handles dice rolling with cryptographically secure randomness and persists
 * each result in the {@code dice_rolls} table.
 *
 * <p>Uses {@link SecureRandom} — never Math.random() — to prevent client-side
 * result manipulation. Arquitetura §4.1 (UC-03 engine impact) / §5.1.2 (Dice Service).
 *
 * <p>Formula format: NdX | NdX+M | NdX-M
 * N = 1–99, X ∈ {4,6,8,10,12,20,100}, M = integer modifier.
 * Mirrors {@code src/lib/dice.ts} FORMULA_REGEX and VALID_SIDES — UC-03 RN-01.
 */
@Service
@RequiredArgsConstructor
public class DiceService {

    /** Valid die face counts — UC-03 RN-01 / dice.ts VALID_SIDES. */
    private static final Set<Integer> VALID_SIDES = Set.of(4, 6, 8, 10, 12, 20, 100);

    /** Mirrors FORMULA_REGEX in dice.ts — UC-03 RN-01. */
    private static final Pattern FORMULA_PATTERN =
            Pattern.compile("^([1-9][0-9]?)d(4|6|8|10|12|20|100)([+-]\\d+)?$",
                    Pattern.CASE_INSENSITIVE);

    /** Max history returned per request — UC-03 RN-04 / S02. */
    private static final int HISTORY_LIMIT = 50;

    /**
     * Cryptographically secure RNG — java.security.SecureRandom.
     * Arquitetura §4.1 (UC-03) / UC-03 RE-01.
     */
    private final SecureRandom secureRandom = new SecureRandom();

    private final DiceRollRepository diceRollRepository;
    private final UserRepository     userRepository;

    // ── Roll ──────────────────────────────────────────────────────────────────

    /**
     * Validates the formula, generates secure results, persists the roll
     * and returns the result to the controller — UC-03 §3.1.
     *
     * @throws InvalidFormulaException if the formula is malformed — UC-03 E01 / MSG006.
     */
    @Transactional
    public RollResponse roll(UUID userId, RollRequest request) {
        String formula = request.formula().trim();
        ParsedFormula parsed = parse(formula);

        // Generate individual die results with SecureRandom — UC-03 RE-01
        List<Integer> rolls = new ArrayList<>(parsed.n());
        for (int i = 0; i < parsed.n(); i++) {
            rolls.add(secureRandom.nextInt(parsed.sides()) + 1);
        }

        int total = rolls.stream().mapToInt(Integer::intValue).sum() + parsed.mod();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        DiceRoll entity = DiceRoll.builder()
                .user(user)
                .formula(formula)
                .individualResults(rolls)
                .total(total)
                .build();

        DiceRoll saved = diceRollRepository.save(entity);

        return new RollResponse(saved.getId(), formula, rolls, parsed.mod(), total,
                saved.getRolledAt());
    }


    // ── Save (client-computed result) ─────────────────────────────────────────

    /**
     * Persists a roll result that was already computed client-side.
     * Does NOT re-roll — trusts the values sent by the frontend.
     * This keeps the history consistent across devices with what the player saw.
     *
     * Formula is still validated so garbage data can't be stored.
     */
    @Transactional
    public RollResponse save(UUID userId, SaveRollRequest request) {
        // Validate formula format (but don't re-roll)
        String formula = request.formula().trim();
        if (!FORMULA_PATTERN.matcher(formula).matches()) {
            throw new InvalidFormulaException(formula);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        DiceRoll entity = DiceRoll.builder()
                .user(user)
                .formula(formula)
                .individualResults(request.rolls())
                .total(request.total())
                .build();

        DiceRoll saved = diceRollRepository.save(entity);

        return new RollResponse(saved.getId(), formula, request.rolls(),
                request.mod(), request.total(), saved.getRolledAt());
    }

    // ── History ───────────────────────────────────────────────────────────────

    /**
     * Returns the last 50 rolls for a user, newest first — UC-03 S02 / RN-04.
     * Mirrors the 50-entry cap in storage.ts addHistory().
     */
    @Transactional(readOnly = true)
    public List<RollResponse> getHistory(UUID userId) {
        Page<DiceRoll> page = diceRollRepository
                .findByUserIdOrderByRolledAtDesc(userId,
                        PageRequest.of(0, HISTORY_LIMIT));

        return page.stream()
                .map(r -> new RollResponse(
                        r.getId(),
                        r.getFormula(),
                        r.getIndividualResults(),
                        extractMod(r.getFormula()),
                        r.getTotal(),
                        r.getRolledAt()))
                .toList();
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private ParsedFormula parse(String formula) {
        Matcher m = FORMULA_PATTERN.matcher(formula);
        if (!m.matches()) {
            throw new InvalidFormulaException(formula);
        }
        int n     = Integer.parseInt(m.group(1));
        int sides = Integer.parseInt(m.group(2));
        int mod   = m.group(3) != null ? Integer.parseInt(m.group(3)) : 0;

        if (!VALID_SIDES.contains(sides)) {
            throw new InvalidFormulaException(formula);
        }
        return new ParsedFormula(n, sides, mod);
    }

    /** Re-parses a stored formula to extract the modifier for the response. */
    private int extractMod(String formula) {
        Matcher m = FORMULA_PATTERN.matcher(formula);
        if (m.matches() && m.group(3) != null) {
            return Integer.parseInt(m.group(3));
        }
        return 0;
    }

    private record ParsedFormula(int n, int sides, int mod) {}
}