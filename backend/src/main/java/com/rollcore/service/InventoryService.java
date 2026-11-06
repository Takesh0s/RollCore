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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Inventory (items and coins) of a character sheet.
 *
 * <p>Every operation first loads the character through
 * {@link CharacterRepository#findByIdAndUserId}, so the sheet of another user
 * answers 404 exactly like a sheet that does not exist.
 */
@Service
@RequiredArgsConstructor
public class InventoryService {

    /** Max item stacks per character. */
    static final int MAX_ITEMS = 200;

    private final CharacterRepository     characters;
    private final CharacterItemRepository items;

    @Transactional(readOnly = true)
    public InventoryResponse get(UUID userId, UUID characterId) {
        Character character = owned(userId, characterId);
        return toResponse(character, items.findByCharacterIdOrderByCreatedAtAsc(characterId));
    }

    @Transactional
    public InventoryResponse.Item addItem(UUID userId, UUID characterId, ItemRequest request) {
        Character character = owned(userId, characterId);
        if (items.countByCharacterId(characterId) >= MAX_ITEMS) {
            throw new ConflictException("Esta ficha já tem " + MAX_ITEMS + " itens.");
        }
        CharacterItem item = CharacterItem.builder().character(character).build();
        apply(item, request);
        return InventoryResponse.Item.from(items.save(item));
    }

    @Transactional
    public InventoryResponse.Item updateItem(UUID userId, UUID characterId, UUID itemId,
                                             ItemRequest request) {
        owned(userId, characterId);
        CharacterItem item = items.findByIdAndCharacterId(itemId, characterId)
                .orElseThrow(() -> new NotFoundException("Item não encontrado."));
        apply(item, request);
        return InventoryResponse.Item.from(items.save(item));
    }

    @Transactional
    public void deleteItem(UUID userId, UUID characterId, UUID itemId) {
        owned(userId, characterId);
        CharacterItem item = items.findByIdAndCharacterId(itemId, characterId)
                .orElseThrow(() -> new NotFoundException("Item não encontrado."));
        items.delete(item);
    }

    @Transactional
    public InventoryResponse.Coins setCoins(UUID userId, UUID characterId, CoinsRequest request) {
        Character character = owned(userId, characterId);
        character.setCoinsPp(request.pp());
        character.setCoinsGp(request.gp());
        character.setCoinsSp(request.sp());
        character.setCoinsCp(request.cp());
        characters.save(character);
        return coinsOf(character);
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private Character owned(UUID userId, UUID characterId) {
        return characters.findByIdAndUserId(characterId, userId)
                .orElseThrow(() -> new NotFoundException("Personagem não encontrado."));
    }

    private static void apply(CharacterItem item, ItemRequest request) {
        item.setName(request.name().trim());
        item.setCategory(request.category() == null ? "other" : request.category());
        item.setQuantity(request.quantity());
        item.setWeight(request.weight() == null ? BigDecimal.ZERO : request.weight());
        item.setDamage(blankToNull(request.damage()));
        item.setDescription(blankToNull(request.description()));
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static InventoryResponse toResponse(Character character, List<CharacterItem> list) {
        return new InventoryResponse(
                list.stream().map(InventoryResponse.Item::from).toList(),
                coinsOf(character));
    }

    private static InventoryResponse.Coins coinsOf(Character c) {
        return new InventoryResponse.Coins(c.getCoinsPp(), c.getCoinsGp(), c.getCoinsSp(), c.getCoinsCp());
    }
}
