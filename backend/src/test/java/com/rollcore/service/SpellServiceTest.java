package com.rollcore.service;

import com.rollcore.dto.response.SpellResponse;
import com.rollcore.entity.Character;
import com.rollcore.entity.CharacterSpell;
import com.rollcore.entity.CharacterSpellId;
import com.rollcore.entity.Spell;
import com.rollcore.entity.User;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.CharacterRepository;
import com.rollcore.repository.CharacterSpellRepository;
import com.rollcore.repository.SpellRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SpellService")
class SpellServiceTest {

    @Mock SpellRepository          spellRepository;
    @Mock CharacterSpellRepository characterSpellRepository;
    @Mock CharacterRepository      characterRepository;
    @InjectMocks SpellService      spellService;

    private final UUID userId      = UUID.randomUUID();
    private final UUID characterId = UUID.randomUUID();
    private final UUID spellId     = UUID.randomUUID();

    private Character character;
    private Spell     spell;

    @BeforeEach
    void setUp() {
        character = Character.builder()
                .id(characterId)
                .user(User.builder().id(userId).email("a@b.com").username("hero").passwordHash("x").build())
                .name("Gandalf").characterClass("Mago").race("Humano").level(10)
                .attributes(Map.of("STR",10,"DEX",14,"CON",12,"INT",20,"WIS",16,"CHA",13))
                .hp(60).maxHp(60).ac(12).build();

        spell = Spell.builder()
                .id(spellId).name("Bola de Fogo").level(3).school("Evocação")
                .castingTime("1 ação").range("45 metros").components("V,S,M").duration("Instantânea")
                .description("Uma faísca brilhante...").classes(List.of("Feiticeiro","Mago"))
                .ritual(false).concentration(false).damageDice("8d6").damageType("Fogo").saveAttribute("DEX")
                .build();
    }

    // ── filter ────────────────────────────────────────────────────────────────

    @Nested @DisplayName("filter()")
    class FilterTest {

        @Test @DisplayName("returns mapped SpellResponse list")
        void filterReturnsSpells() {
            when(spellRepository.filter(any(), any(), any())).thenReturn(List.of(spell));
            List<SpellResponse> result = spellService.filter("Mago", 3, null);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Bola de Fogo");
            assertThat(result.get(0).damageDice()).isEqualTo("8d6");
        }

        @Test @DisplayName("null filters passed through to repo")
        void filterNullParams() {
            when(spellRepository.filter(null, null, null)).thenReturn(List.of());
            assertThat(spellService.filter(null, null, null)).isEmpty();
        }

        @Test @DisplayName("blank class treated as null")
        void blankClassTreatedAsNull() {
            when(spellRepository.filter(null, null, null)).thenReturn(List.of());
            spellService.filter("  ", null, null);
            verify(spellRepository).filter(null, null, null);
        }
    }

    // ── addToCharacter ────────────────────────────────────────────────────────

    @Nested @DisplayName("addToCharacter()")
    class AddTest {

        @Test @DisplayName("saves CharacterSpell and returns spell data")
        void addSuccess() {
            when(characterRepository.findByIdAndUserId(characterId, userId)).thenReturn(Optional.of(character));
            when(spellRepository.findById(spellId)).thenReturn(Optional.of(spell));
            when(characterSpellRepository.existsByIdCharacterIdAndIdSpellId(characterId, spellId)).thenReturn(false);
            when(characterSpellRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            SpellResponse result = spellService.addToCharacter(characterId, spellId, userId);

            assertThat(result.name()).isEqualTo("Bola de Fogo");
            verify(characterSpellRepository).save(any(CharacterSpell.class));
        }

        @Test @DisplayName("throws ConflictException if spell already known")
        void addDuplicate() {
            when(characterRepository.findByIdAndUserId(characterId, userId)).thenReturn(Optional.of(character));
            when(spellRepository.findById(spellId)).thenReturn(Optional.of(spell));
            when(characterSpellRepository.existsByIdCharacterIdAndIdSpellId(characterId, spellId)).thenReturn(true);

            assertThatThrownBy(() -> spellService.addToCharacter(characterId, spellId, userId))
                    .isInstanceOf(ConflictException.class);
            verify(characterSpellRepository, never()).save(any());
        }

        @Test @DisplayName("throws ForbiddenException for wrong owner")
        void addForbidden() {
            when(characterRepository.findByIdAndUserId(characterId, userId)).thenReturn(Optional.empty());
            when(characterRepository.existsById(characterId)).thenReturn(true);

            assertThatThrownBy(() -> spellService.addToCharacter(characterId, spellId, userId))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    // ── removeFromCharacter ───────────────────────────────────────────────────

    @Nested @DisplayName("removeFromCharacter()")
    class RemoveTest {

        @Test @DisplayName("deletes entry when spell is known")
        void removeSuccess() {
            when(characterRepository.findByIdAndUserId(characterId, userId)).thenReturn(Optional.of(character));
            when(characterSpellRepository.existsByIdCharacterIdAndIdSpellId(characterId, spellId)).thenReturn(true);

            spellService.removeFromCharacter(characterId, spellId, userId);

            verify(characterSpellRepository).deleteByIdCharacterIdAndIdSpellId(characterId, spellId);
        }

        @Test @DisplayName("throws NotFoundException if spell not in list")
        void removeNotFound() {
            when(characterRepository.findByIdAndUserId(characterId, userId)).thenReturn(Optional.of(character));
            when(characterSpellRepository.existsByIdCharacterIdAndIdSpellId(characterId, spellId)).thenReturn(false);

            assertThatThrownBy(() -> spellService.removeFromCharacter(characterId, spellId, userId))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ── listForCharacter ──────────────────────────────────────────────────────

    @Test @DisplayName("listForCharacter returns spell list mapped from join table")
    void listForCharacter() {
        CharacterSpell cs = CharacterSpell.builder()
                .id(new CharacterSpellId(characterId, spellId))
                .character(character).spell(spell).build();

        when(characterRepository.findByIdAndUserId(characterId, userId)).thenReturn(Optional.of(character));
        when(characterSpellRepository
                .findByIdCharacterIdOrderByPositionAscSpellLevelAscSpellNameAsc(characterId))
                .thenReturn(List.of(cs));

        List<SpellResponse> result = spellService.listForCharacter(characterId, userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Bola de Fogo");
    }
}