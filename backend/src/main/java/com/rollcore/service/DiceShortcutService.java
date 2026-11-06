package com.rollcore.service;

import com.rollcore.dto.request.DiceShortcutRequest;
import com.rollcore.dto.response.DiceShortcutResponse;
import com.rollcore.entity.DiceShortcut;
import com.rollcore.entity.User;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.InvalidFormulaException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.DiceShortcutRepository;
import com.rollcore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Saved dice formulas ("Atalhos salvos"). Each shortcut belongs to one user and is
 * never visible to anyone else: a shortcut of another user answers 404.
 */
@Service
@RequiredArgsConstructor
public class DiceShortcutService {

    /** Max shortcuts per user, keeps the screen and the table small. */
    static final int MAX_SHORTCUTS = 12;

    /** Same grammar as {@link DiceService}: NdX | NdX+M | NdX-M. */
    private static final Pattern FORMULA_PATTERN =
            Pattern.compile("^([1-9][0-9]?)d(4|6|8|10|12|20|100)([+-]\\d+)?$",
                    Pattern.CASE_INSENSITIVE);

    private final DiceShortcutRepository shortcuts;
    private final UserRepository         users;

    @Transactional(readOnly = true)
    public List<DiceShortcutResponse> list(UUID userId) {
        return shortcuts.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(DiceShortcutResponse::from)
                .toList();
    }

    @Transactional
    public DiceShortcutResponse create(UUID userId, DiceShortcutRequest request) {
        String formula = request.formula().replace(" ", "");
        if (!FORMULA_PATTERN.matcher(formula).matches()) {
            throw new InvalidFormulaException(request.formula().trim());
        }
        String name = request.name().trim();
        if (name.isEmpty()) {
            throw new InvalidFormulaException(request.formula().trim());
        }
        if (shortcuts.countByUserId(userId) >= MAX_SHORTCUTS) {
            throw new ConflictException(
                    "Você já tem " + MAX_SHORTCUTS + " atalhos. Remova um para criar outro.");
        }

        User user = users.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        DiceShortcut saved = shortcuts.save(DiceShortcut.builder()
                .user(user)
                .name(name)
                .formula(formula.toLowerCase())
                .build());
        return DiceShortcutResponse.from(saved);
    }

    @Transactional
    public void delete(UUID userId, UUID shortcutId) {
        DiceShortcut shortcut = shortcuts.findByIdAndUserId(shortcutId, userId)
                .orElseThrow(() -> new NotFoundException("Atalho não encontrado."));
        shortcuts.delete(shortcut);
    }
}
