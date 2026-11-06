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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Unit tests for {@link DiceShortcutService}. */
@ExtendWith(MockitoExtension.class)
@DisplayName("DiceShortcutService")
class DiceShortcutServiceTest {

    @Mock DiceShortcutRepository shortcuts;
    @Mock UserRepository         users;
    @InjectMocks DiceShortcutService service;

    private final UUID userId = UUID.randomUUID();
    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(userId).email("a@b.c").username("ana").passwordHash("h").build();
    }

    @Test
    @DisplayName("list maps the user's shortcuts")
    void listMaps() {
        UUID id = UUID.randomUUID();
        when(shortcuts.findByUserIdOrderByCreatedAtAsc(userId)).thenReturn(List.of(
                DiceShortcut.builder().id(id).user(user).name("Iniciativa").formula("1d20+2").build()));

        List<DiceShortcutResponse> result = service.list(userId);

        assertThat(result).containsExactly(new DiceShortcutResponse(id, "Iniciativa", "1d20+2"));
    }

    @Test
    @DisplayName("create trims the name, strips spaces and lower-cases the formula")
    void createNormalises() {
        when(shortcuts.countByUserId(userId)).thenReturn(0L);
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(shortcuts.save(any())).thenAnswer(inv -> {
            DiceShortcut s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        DiceShortcutResponse r = service.create(userId,
                new DiceShortcutRequest("  Ataque · espada ", "1D20 + 7"));

        assertThat(r.name()).isEqualTo("Ataque · espada");
        assertThat(r.formula()).isEqualTo("1d20+7");
    }

    @Test
    @DisplayName("create rejects an invalid formula without touching the database")
    void createInvalidFormula() {
        assertThatThrownBy(() -> service.create(userId, new DiceShortcutRequest("Ruim", "2d7")))
                .isInstanceOf(InvalidFormulaException.class);

        verifyNoInteractions(shortcuts);
    }

    @Test
    @DisplayName("create rejects a blank name")
    void createBlankName() {
        assertThatThrownBy(() -> service.create(userId, new DiceShortcutRequest("   ", "1d20")))
                .isInstanceOf(InvalidFormulaException.class);

        verify(shortcuts, never()).save(any());
    }

    @Test
    @DisplayName("create rejects the 13th shortcut")
    void createOverLimit() {
        when(shortcuts.countByUserId(userId)).thenReturn((long) DiceShortcutService.MAX_SHORTCUTS);

        assertThatThrownBy(() -> service.create(userId, new DiceShortcutRequest("Mais um", "1d6")))
                .isInstanceOf(ConflictException.class);

        verify(shortcuts, never()).save(any());
    }

    @Test
    @DisplayName("delete removes the caller's shortcut")
    void deleteOwn() {
        UUID id = UUID.randomUUID();
        DiceShortcut shortcut = DiceShortcut.builder().id(id).user(user).name("x").formula("1d4").build();
        when(shortcuts.findByIdAndUserId(id, userId)).thenReturn(Optional.of(shortcut));

        service.delete(userId, id);

        verify(shortcuts).delete(shortcut);
    }

    @Test
    @DisplayName("delete answers 404 for a shortcut that is not the caller's")
    void deleteForeign() {
        UUID id = UUID.randomUUID();
        when(shortcuts.findByIdAndUserId(id, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(userId, id)).isInstanceOf(NotFoundException.class);

        verify(shortcuts, never()).delete(any(DiceShortcut.class));
    }
}
