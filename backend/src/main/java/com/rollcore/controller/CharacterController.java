package com.rollcore.controller;

import com.rollcore.dto.request.CharacterRequest;
import com.rollcore.dto.response.CharacterResponse;
import com.rollcore.service.CharacterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Character sheet endpoints — UC-02.
 *
 * <pre>
 * GET    /characters          → list all characters for the authenticated user
 * POST   /characters          → create new character
 * GET    /characters/{id}     → get one character
 * PUT    /characters/{id}     → full update
 * DELETE /characters/{id}     → delete
 * </pre>
 *
 * All endpoints require a valid JWT. The user UUID is extracted from the
 * security context ({@code @AuthenticationPrincipal UUID userId}) and used
 * as an ownership check — never trusted from the request body.
 */
@Tag(name = "Characters", description = "D&D 5e character sheets — UC-02")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    @Operation(summary = "List all characters for the authenticated user")
    @GetMapping
    public List<CharacterResponse> list(@AuthenticationPrincipal UUID userId) {
        return characterService.listByUser(userId);
    }

    @Operation(summary = "Create a new character")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CharacterResponse create(
            @Valid @RequestBody CharacterRequest request,
            @AuthenticationPrincipal UUID userId) {
        return characterService.create(request, userId);
    }

    @Operation(summary = "Retrieve a character by ID")
    @GetMapping("/{id}")
    public CharacterResponse getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        return characterService.getById(id, userId);
    }

    @Operation(summary = "Update a character (full replacement)")
    @PutMapping("/{id}")
    public CharacterResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody CharacterRequest request,
            @AuthenticationPrincipal UUID userId) {
        return characterService.update(id, request, userId);
    }

    @Operation(summary = "Delete a character")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        characterService.delete(id, userId);
    }
}
