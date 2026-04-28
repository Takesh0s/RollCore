package com.rollcore.service;

import com.rollcore.dto.request.CharacterRequest;
import com.rollcore.dto.response.CharacterResponse;
import com.rollcore.entity.Character;
import com.rollcore.entity.User;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.CharacterRepository;
import com.rollcore.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link CharacterService} — UC-02.
 *
 * <p>Validates business rules for D&D 5e character sheets:
 * <ul>
 *   <li>UC-02 RN-01: AC = 10 + DEX modifier, calculated server-side.
 *   <li>UC-02 RN-04: Spell slots populated by DndEngine, never by client.
 *   <li>UC-02: Ownership validation — characters from other users return 403/404.
 *   <li>UC-02: Full CRUD operations (create, list, getById, update, delete).
 * </ul>
 *
 * <p>No Spring context required — external dependencies are mocked with Mockito.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CharacterService — UC-02")
class CharacterServiceTest {

    @Mock  CharacterRepository characterRepository;
    @Mock  UserRepository      userRepository;
    @Spy   DndEngine           engine = new DndEngine();   // real engine — regras D&D são puras
    @InjectMocks CharacterService service;

    private final UUID userId      = UUID.randomUUID();
    private final UUID characterId = UUID.randomUUID();
    private       User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(userId)
                .email("jogador@rollcore.com")
                .passwordHash("hash")
                .build();
    }

    // Data and helper methods

    /** Creates a CharacterRequest with the specified attributes. */
    private CharacterRequest request(String className, int level, Map<String, Integer> attrs) {
        return new CharacterRequest(
                "Aragorn",
                className,
                "",
                "Humano",
                level,
                attrs,
                30, 30, 0
        );
    }

    /** Mocks save() to return the same entity (standard JPA behavior). */
    private void mockSave() {
        when(characterRepository.save(any(Character.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    // Character creation and validation

    @Nested
    @DisplayName("create() — Character creation")
    class CreateTest {

        @Test
        @DisplayName("AC is calculated server-side as 10 + calcMod(DEX) — UC-02 RN-01")
        void acIsComputedServerSide() {
            // DEX 14 → mod +2 → expected AC = 12
            Map<String, Integer> attrs = Map.of(
                    "STR", 16, "DEX", 14, "CON", 14,
                    "INT", 10, "WIS", 10, "CHA", 8
            );
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            mockSave();

            CharacterResponse resp = service.create(request("Guerreiro", 1, attrs), userId);

            assertThat(resp.ac()).isEqualTo(12);
        }

        @ParameterizedTest(name = "DEX={0} → AC={1}")
        @CsvSource({
            "10, 10",   // mod 0
            "12, 11",   // mod +1
            "16, 13",   // mod +3
            "20, 15",   // mod +5
            " 8,  9",   // mod -1
            " 1,  5"    // mod -5 (absolute minimum)
        })
        @DisplayName("AC follows modifier table for all DEX values")
        void acModifierTable(int dex, int expectedAc) {
            Map<String, Integer> attrs = Map.of(
                    "STR", 10, "DEX", dex, "CON", 10,
                    "INT", 10, "WIS", 10, "CHA", 10
            );
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            mockSave();

            CharacterResponse resp = service.create(request("Guerreiro", 1, attrs), userId);

            assertThat(resp.ac()).isEqualTo(expectedAc);
        }

        @Test
        @DisplayName("Wizard level 1 spell slots are populated by DndEngine — UC-02 RN-04")
        void spellSlotsArePopulatedByEngine() {
            Map<String, Integer> attrs = Map.of(
                    "STR", 8, "DEX", 12, "CON", 12,
                    "INT", 17, "WIS", 12, "CHA", 10
            );
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            mockSave();

            CharacterResponse resp = service.create(request("Mago", 1, attrs), userId);

            // Wizard level 1 → 2 slots of level 1, 0 for others
            assertThat(resp.spellSlots()).isNotNull();
            assertThat(resp.spellSlots().get("1")).isEqualTo(2);
            assertThat(resp.spellSlots().get("2")).isEqualTo(0);
            assertThat(resp.warlockSlots()).isNull();   // not a warlock
        }

        @Test
        @DisplayName("Fighter (non-caster) has null spell slots — UC-02 RN-04")
        void nonCasterHasNullSpellSlots() {
            Map<String, Integer> attrs = Map.of(
                    "STR", 17, "DEX", 13, "CON", 14,
                    "INT", 10, "WIS", 12, "CHA", 8
            );
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            mockSave();

            CharacterResponse resp = service.create(request("Guerreiro", 5, attrs), userId);

            assertThat(resp.spellSlots()).isNull();
            assertThat(resp.warlockSlots()).isNull();
        }

        @Test
        @DisplayName("Warlock level 3 has Pact Magic populated — UC-02 RN-04")
        void warlockSlotsArePopulated() {
            Map<String, Integer> attrs = Map.of(
                    "STR", 10, "DEX", 14, "CON", 14,
                    "INT", 10, "WIS", 12, "CHA", 16
            );
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            mockSave();

            CharacterResponse resp = service.create(request("Warlock", 3, attrs), userId);

            // Warlock level 3 → 2 slots of level 2
            assertThat(resp.warlockSlots()).isNotNull();
            assertThat(resp.warlockSlots().get("total")).isEqualTo(2);
            assertThat(resp.warlockSlots().get("level")).isEqualTo(2);
            assertThat(resp.spellSlots()).isNull();   // warlock does not use standard table
        }

        @Test
        @DisplayName("save() is called exactly once with correct entity")
        void saveIsCalledOnce() {
            Map<String, Integer> attrs = Map.of(
                    "STR", 10, "DEX", 10, "CON", 10,
                    "INT", 10, "WIS", 10, "CHA", 10
            );
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            mockSave();

            service.create(request("Bardo", 2, attrs), userId);

            ArgumentCaptor<Character> captor = ArgumentCaptor.forClass(Character.class);
            verify(characterRepository).save(captor.capture());
            assertThat(captor.getValue().getName()).isEqualTo("Aragorn");
            assertThat(captor.getValue().getCharacterClass()).isEqualTo("Bardo");
            assertThat(captor.getValue().getLevel()).isEqualTo(2);
        }

        @Test
        @DisplayName("Null tempHp in request is treated as 0")
        void tempHpNullDefaultsToZero() {
            Map<String, Integer> attrs = Map.of(
                    "STR", 10, "DEX", 10, "CON", 10,
                    "INT", 10, "WIS", 10, "CHA", 10
            );
            // tempHp explicitly null
            CharacterRequest req = new CharacterRequest(
                    "Gimli", "Guerreiro", null, "Anão", 5, attrs, 45, 45, null
            );
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            mockSave();

            CharacterResponse resp = service.create(req, userId);

            assertThat(resp.tempHp()).isEqualTo(0);
        }
    }

    // Character listing and filtering

    @Nested
    @DisplayName("listByUser() — Character listing")
    class ListTest {

        @Test
        @DisplayName("Returns mapped CharacterResponse list for user")
        void returnsListForUser() {
            Character c = Character.builder()
                    .id(characterId).user(user).name("Legolas")
                    .characterClass("Patrulheiro").subclass("").race("Elfo")
                    .level(10).attributes(Map.of(
                            "STR", 12, "DEX", 20, "CON", 14,
                            "INT", 12, "WIS", 16, "CHA", 14))
                    .hp(80).maxHp(80).tempHp(0).ac(15).build();

            when(characterRepository.findByUserIdOrderByCreatedAtDesc(userId))
                    .thenReturn(List.of(c));

            List<CharacterResponse> result = service.listByUser(userId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Legolas");
        }

        @Test
        @DisplayName("Returns empty list when user has no characters")
        void returnsEmptyList() {
            when(characterRepository.findByUserIdOrderByCreatedAtDesc(userId))
                    .thenReturn(List.of());

            assertThat(service.listByUser(userId)).isEmpty();
        }
    }

    // Character retrieval with access control

    @Nested
    @DisplayName("getById() — Access control — UC-02 RN-04")
    class GetByIdTest {

        @Test
        @DisplayName("Returns character when owned by authenticated user")
        void returnsOwnedCharacter() {
            Character c = Character.builder()
                    .id(characterId).user(user).name("Frodo")
                    .characterClass("Ladino").subclass("").race("Halfling")
                    .level(5).attributes(Map.of(
                            "STR", 8, "DEX", 16, "CON", 12,
                            "INT", 12, "WIS", 14, "CHA", 12))
                    .hp(30).maxHp(30).tempHp(0).ac(13).build();

            when(characterRepository.findByIdAndUserId(characterId, userId))
                    .thenReturn(Optional.of(c));

            CharacterResponse resp = service.getById(characterId, userId);

            assertThat(resp.name()).isEqualTo("Frodo");
            assertThat(resp.id()).isEqualTo(characterId);
        }

        @Test
        @DisplayName("Throws ForbiddenException when character belongs to another user — UC-02 RN-04")
        void throwsForbiddenForOtherUserCharacter() {
            when(characterRepository.findByIdAndUserId(characterId, userId))
                    .thenReturn(Optional.empty());
            when(characterRepository.existsById(characterId)).thenReturn(true);

            assertThatThrownBy(() -> service.getById(characterId, userId))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Acesso negado");
        }

        @Test
        @DisplayName("Throws NotFoundException when character does not exist")
        void throwsNotFoundForMissingCharacter() {
            when(characterRepository.findByIdAndUserId(characterId, userId))
                    .thenReturn(Optional.empty());
            when(characterRepository.existsById(characterId)).thenReturn(false);

            assertThatThrownBy(() -> service.getById(characterId, userId))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("não encontrado");
        }
    }

    // Character updates and recalculation

    @Nested
    @DisplayName("update() — Character editing")
    class UpdateTest {

        @Test
        @DisplayName("Recalculates AC when editing DEX — UC-02 RN-01")
        void recalculatesAcOnUpdate() {
            // Existing character: DEX 10 → AC 10
            Character existing = Character.builder()
                    .id(characterId).user(user).name("Boromir")
                    .characterClass("Guerreiro").subclass("").race("Humano")
                    .level(5).attributes(Map.of(
                            "STR", 18, "DEX", 10, "CON", 16,
                            "INT", 10, "WIS", 12, "CHA", 14))
                    .hp(50).maxHp(50).tempHp(0).ac(10).build();

            when(characterRepository.findByIdAndUserId(characterId, userId))
                    .thenReturn(Optional.of(existing));
            when(characterRepository.save(any(Character.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // Update: DEX increases to 16 → mod +3 → AC should be 13
            Map<String, Integer> newAttrs = Map.of(
                    "STR", 18, "DEX", 16, "CON", 16,
                    "INT", 10, "WIS", 12, "CHA", 14
            );
            CharacterResponse resp = service.update(
                    characterId,
                    request("Guerreiro", 5, newAttrs),
                    userId
            );

            assertThat(resp.ac()).isEqualTo(13);
        }

        @Test
        @DisplayName("Spell slots recalculated when level changes — UC-02 RN-04")
        void spellSlotsRecalculatedOnLevelChange() {
            Character existing = Character.builder()
                    .id(characterId).user(user).name("Gandalf")
                    .characterClass("Mago").subclass("").race("Humano")
                    .level(1).attributes(Map.of(
                            "STR", 10, "DEX", 10, "CON", 12,
                            "INT", 18, "WIS", 14, "CHA", 10))
                    .hp(8).maxHp(8).tempHp(0).ac(10)
                    .spellSlots(Map.of("1", 2)).build();

            when(characterRepository.findByIdAndUserId(characterId, userId))
                    .thenReturn(Optional.of(existing));
            when(characterRepository.save(any(Character.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // Level up to 5 → should have 4/3/2 slots
            Map<String, Integer> attrs = Map.of(
                    "STR", 10, "DEX", 10, "CON", 12,
                    "INT", 18, "WIS", 14, "CHA", 10
            );
            CharacterResponse resp = service.update(
                    characterId,
                    request("Mago", 5, attrs),
                    userId
            );

            assertThat(resp.spellSlots()).isNotNull();
            assertThat(resp.spellSlots().get("1")).isEqualTo(4);
            assertThat(resp.spellSlots().get("2")).isEqualTo(3);
            assertThat(resp.spellSlots().get("3")).isEqualTo(2);
        }
    }

    // Character deletion

    @Nested
    @DisplayName("delete() — Character deletion")
    class DeleteTest {

        @Test
        @DisplayName("Deletes character owned by user without throwing exception")
        void deletesOwnedCharacter() {
            Character c = Character.builder()
                    .id(characterId).user(user).name("Saruman")
                    .characterClass("Mago").subclass("").race("Humano")
                    .level(20).attributes(Map.of(
                            "STR", 10, "DEX", 10, "CON", 10,
                            "INT", 20, "WIS", 16, "CHA", 16))
                    .hp(100).maxHp(100).tempHp(0).ac(10).build();

            when(characterRepository.findByIdAndUserId(characterId, userId))
                    .thenReturn(Optional.of(c));

            service.delete(characterId, userId);

            verify(characterRepository).delete(c);
        }

        @Test
        @DisplayName("Throws ForbiddenException when attempting to delete another user's character")
        void throwsForbiddenOnDeleteOther() {
            when(characterRepository.findByIdAndUserId(characterId, userId))
                    .thenReturn(Optional.empty());
            when(characterRepository.existsById(characterId)).thenReturn(true);

            assertThatThrownBy(() -> service.delete(characterId, userId))
                    .isInstanceOf(ForbiddenException.class);

            verify(characterRepository, never()).delete(any(Character.class));
        }
    }
}