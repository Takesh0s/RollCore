package com.rollcore.service;

import com.rollcore.dto.request.CoinsRequest;
import com.rollcore.dto.request.ItemRequest;
import com.rollcore.dto.response.InventoryResponse;
import com.rollcore.entity.Character;
import com.rollcore.entity.CharacterItem;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.CharacterItemRepository;
import com.rollcore.repository.CharacterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Unit tests for {@link InventoryService}. */
@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryService")
class InventoryServiceTest {

    @Mock CharacterRepository     characters;
    @Mock CharacterItemRepository items;
    @InjectMocks InventoryService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID charId = UUID.randomUUID();
    private Character character;

    @BeforeEach
    void setUp() {
        character = Character.builder().id(charId).name("Zeime").build();
    }

    private void ownCharacter() {
        when(characters.findByIdAndUserId(charId, userId)).thenReturn(Optional.of(character));
    }

    private static ItemRequest request(String name, String category, int qty, String weight) {
        return new ItemRequest(name, category, qty,
                weight == null ? null : new BigDecimal(weight), "  1D8 Cort.  ", "  ");
    }

    @Test
    @DisplayName("get returns items and coins of the caller's character")
    void getReturnsItemsAndCoins() {
        ownCharacter();
        character.setCoinsGp(15);
        character.setCoinsCp(60);
        when(items.findByCharacterIdOrderByCreatedAtAsc(charId)).thenReturn(List.of(
                CharacterItem.builder().id(UUID.randomUUID()).character(character)
                        .name("Machado").category("weapon").quantity(1)
                        .weight(new BigDecimal("2.5")).damage("1D8 Cort.").build()));

        InventoryResponse r = service.get(userId, charId);

        assertThat(r.items()).hasSize(1);
        assertThat(r.items().get(0).name()).isEqualTo("Machado");
        assertThat(r.coins()).isEqualTo(new InventoryResponse.Coins(0, 15, 0, 60));
    }

    @Test
    @DisplayName("a character that is not the caller's answers 404 on every operation")
    void foreignCharacterIs404() {
        when(characters.findByIdAndUserId(charId, userId)).thenReturn(Optional.empty());
        UUID itemId = UUID.randomUUID();

        assertThatThrownBy(() -> service.get(userId, charId)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.addItem(userId, charId, request("x", null, 1, null)))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.updateItem(userId, charId, itemId, request("x", null, 1, null)))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.deleteItem(userId, charId, itemId))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.setCoins(userId, charId, new CoinsRequest(0, 0, 0, 0)))
                .isInstanceOf(NotFoundException.class);

        verifyNoInteractions(items);
    }

    @Test
    @DisplayName("addItem trims text, defaults category/weight and drops blank description")
    void addItemNormalises() {
        ownCharacter();
        when(items.countByCharacterId(charId)).thenReturn(0L);
        when(items.save(any())).thenAnswer(inv -> {
            CharacterItem i = inv.getArgument(0);
            i.setId(UUID.randomUUID());
            return i;
        });

        InventoryResponse.Item r = service.addItem(userId, charId, request("  Rapieira ", null, 2, null));

        assertThat(r.name()).isEqualTo("Rapieira");
        assertThat(r.category()).isEqualTo("other");
        assertThat(r.weight()).isEqualByComparingTo("0");
        assertThat(r.quantity()).isEqualTo(2);
        assertThat(r.damage()).isEqualTo("1D8 Cort.");
        assertThat(r.description()).isNull();
    }

    @Test
    @DisplayName("addItem rejects the 201st item")
    void addItemOverLimit() {
        ownCharacter();
        when(items.countByCharacterId(charId)).thenReturn((long) InventoryService.MAX_ITEMS);

        assertThatThrownBy(() -> service.addItem(userId, charId, request("x", null, 1, null)))
                .isInstanceOf(ConflictException.class);

        verify(items, never()).save(any());
    }

    @Test
    @DisplayName("updateItem changes the item of that character")
    void updateItemChangesFields() {
        ownCharacter();
        UUID itemId = UUID.randomUUID();
        CharacterItem existing = CharacterItem.builder().id(itemId).character(character)
                .name("Adaga").quantity(1).build();
        when(items.findByIdAndCharacterId(itemId, charId)).thenReturn(Optional.of(existing));
        when(items.save(existing)).thenReturn(existing);

        InventoryResponse.Item r = service.updateItem(userId, charId, itemId,
                request("Adaga Envenenada", "weapon", 22, "0.5"));

        assertThat(r.name()).isEqualTo("Adaga Envenenada");
        assertThat(r.category()).isEqualTo("weapon");
        assertThat(r.quantity()).isEqualTo(22);
        assertThat(r.weight()).isEqualByComparingTo("0.5");
    }

    @Test
    @DisplayName("updateItem and deleteItem answer 404 for an item of another character")
    void itemOfAnotherCharacterIs404() {
        ownCharacter();
        UUID itemId = UUID.randomUUID();
        when(items.findByIdAndCharacterId(itemId, charId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateItem(userId, charId, itemId, request("x", null, 1, null)))
                .isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.deleteItem(userId, charId, itemId))
                .isInstanceOf(NotFoundException.class);

        verify(items, never()).save(any());
        verify(items, never()).delete(any());
    }

    @Test
    @DisplayName("deleteItem removes the item")
    void deleteItemRemoves() {
        ownCharacter();
        UUID itemId = UUID.randomUUID();
        CharacterItem existing = CharacterItem.builder().id(itemId).character(character).name("x").build();
        when(items.findByIdAndCharacterId(itemId, charId)).thenReturn(Optional.of(existing));

        service.deleteItem(userId, charId, itemId);

        verify(items).delete(existing);
    }

    @Test
    @DisplayName("setCoins stores the four coin values")
    void setCoinsStores() {
        ownCharacter();

        InventoryResponse.Coins r = service.setCoins(userId, charId, new CoinsRequest(1, 15, 32, 60));

        assertThat(r).isEqualTo(new InventoryResponse.Coins(1, 15, 32, 60));
        assertThat(character.getCoinsGp()).isEqualTo(15);
        verify(characters).save(character);
    }
}
