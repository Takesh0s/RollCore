package com.rollcore.controller;

import com.rollcore.dto.request.CoinsRequest;
import com.rollcore.dto.request.ItemRequest;
import com.rollcore.dto.response.InventoryResponse;
import com.rollcore.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Inventory of a character sheet.
 *
 * <pre>
 * GET    /characters/{id}/inventory           → items and coins
 * POST   /characters/{id}/items               → add an item
 * PUT    /characters/{id}/items/{itemId}      → update an item
 * DELETE /characters/{id}/items/{itemId}      → remove an item
 * PUT    /characters/{id}/coins               → set the coin purse
 * </pre>
 */
@Tag(name = "Inventory", description = "Character items and coins")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/characters/{characterId}")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @Operation(summary = "List the items and coins of a character")
    @GetMapping("/inventory")
    public InventoryResponse inventory(@PathVariable UUID characterId,
                                       @AuthenticationPrincipal UUID userId) {
        return inventoryService.get(userId, characterId);
    }

    @Operation(summary = "Add an item to a character")
    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryResponse.Item addItem(@PathVariable UUID characterId,
                                          @Valid @RequestBody ItemRequest request,
                                          @AuthenticationPrincipal UUID userId) {
        return inventoryService.addItem(userId, characterId, request);
    }

    @Operation(summary = "Update an item")
    @PutMapping("/items/{itemId}")
    public InventoryResponse.Item updateItem(@PathVariable UUID characterId,
                                             @PathVariable UUID itemId,
                                             @Valid @RequestBody ItemRequest request,
                                             @AuthenticationPrincipal UUID userId) {
        return inventoryService.updateItem(userId, characterId, itemId, request);
    }

    @Operation(summary = "Remove an item")
    @DeleteMapping("/items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable UUID characterId,
                           @PathVariable UUID itemId,
                           @AuthenticationPrincipal UUID userId) {
        inventoryService.deleteItem(userId, characterId, itemId);
    }

    @Operation(summary = "Set the coin purse of a character")
    @PutMapping("/coins")
    public InventoryResponse.Coins setCoins(@PathVariable UUID characterId,
                                            @Valid @RequestBody CoinsRequest request,
                                            @AuthenticationPrincipal UUID userId) {
        return inventoryService.setCoins(userId, characterId, request);
    }
}
