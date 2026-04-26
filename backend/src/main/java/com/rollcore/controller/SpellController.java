package com.rollcore.controller;

import com.rollcore.dto.response.SpellResponse;
import com.rollcore.service.SpellService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Spell catalog and character-spell management endpoints — Sprint 8.
 *
 * <pre>
 * GET    /spells                           → filtered catalog
 * GET    /spells/{spellId}                 → single spell detail
 * GET    /characters/{id}/spells           → spells known by a character
 * POST   /characters/{id}/spells/{spellId} → add spell to character
 * DELETE /characters/{id}/spells/{spellId} → remove spell from character
 * </pre>
 */
@Tag(name = "Spells", description = "Compêndio de magias D&D 5e — Sprint 8")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequiredArgsConstructor
public class SpellController {

    private final SpellService spellService;

    // ── Catalog ───────────────────────────────────────────────────────────────

    @Operation(summary = "Listar magias do compêndio com filtros opcionais")
    @GetMapping("/spells")
    public List<SpellResponse> list(
            @RequestParam(required = false) String className,
            @RequestParam(required = false) Integer level,
            @RequestParam(required = false) String search) {
        return spellService.filter(className, level, search);
    }

    @Operation(summary = "Buscar magia por ID")
    @GetMapping("/spells/{spellId}")
    public SpellResponse getById(@PathVariable UUID spellId) {
        return spellService.getById(spellId);
    }

    // ── Character spells ──────────────────────────────────────────────────────

    @Operation(summary = "Listar magias conhecidas por um personagem")
    @GetMapping("/characters/{id}/spells")
    public List<SpellResponse> listForCharacter(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        return spellService.listForCharacter(id, userId);
    }

    @Operation(summary = "Adicionar magia ao personagem")
    @PostMapping("/characters/{id}/spells/{spellId}")
    @ResponseStatus(HttpStatus.CREATED)
    public SpellResponse addToCharacter(
            @PathVariable UUID id,
            @PathVariable UUID spellId,
            @AuthenticationPrincipal UUID userId) {
        return spellService.addToCharacter(id, spellId, userId);
    }

    @Operation(summary = "Remover magia do personagem")
    @DeleteMapping("/characters/{id}/spells/{spellId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFromCharacter(
            @PathVariable UUID id,
            @PathVariable UUID spellId,
            @AuthenticationPrincipal UUID userId) {
        spellService.removeFromCharacter(id, spellId, userId);
    }
}