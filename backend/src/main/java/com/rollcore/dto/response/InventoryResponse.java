package com.rollcore.dto.response;

import com.rollcore.entity.CharacterItem;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** A character's items and coins. */
public record InventoryResponse(List<Item> items, Coins coins) {

    /** One inventory item; {@code weight} is per unit, in kg. */
    public record Item(UUID id, String name, String category, int quantity,
                       BigDecimal weight, String damage, String description) {
        public static Item from(CharacterItem i) {
            return new Item(i.getId(), i.getName(), i.getCategory(), i.getQuantity(),
                    i.getWeight(), i.getDamage(), i.getDescription());
        }
    }

    public record Coins(int pp, int gp, int sp, int cp) {}
}
