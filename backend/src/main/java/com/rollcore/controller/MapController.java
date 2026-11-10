package com.rollcore.controller;

import com.rollcore.dto.request.MapRequest;
import com.rollcore.dto.response.MapResponse;
import com.rollcore.entity.GameMap.Kind;
import com.rollcore.service.MapService;
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
 * Battle maps (GM tools).
 *
 * <pre>
 * GET    /maps                  → the caller's library
 * POST   /maps                  → create
 * GET    /maps/{id}             → one map (own, or published by anyone)
 * PUT    /maps/{id}             → save (author only)
 * DELETE /maps/{id}             → delete (author only)
 * POST   /maps/{id}/publish     → share in the community workshop (author only)
 * POST   /maps/{id}/unpublish   → take it back (author only)
 * POST   /maps/{id}/copy        → copy into the caller's library
 * GET    /maps/community        → published maps (?q=name&amp;kind=MEDIEVAL)
 * </pre>
 */
@Tag(name = "Maps", description = "Battle maps and the community workshop")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/maps")
@RequiredArgsConstructor
public class MapController {

    private final MapService mapService;

    @Operation(summary = "The caller's map library")
    @GetMapping
    public List<MapResponse> mine(@AuthenticationPrincipal UUID userId) {
        return mapService.mine(userId);
    }

    @Operation(summary = "Published maps of the community workshop")
    @GetMapping("/community")
    public List<MapResponse> community(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Kind kind,
            @AuthenticationPrincipal UUID userId) {
        return mapService.community(userId, q, kind);
    }

    @Operation(summary = "Create a map")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MapResponse create(@Valid @RequestBody MapRequest req, @AuthenticationPrincipal UUID userId) {
        return mapService.create(userId, req);
    }

    @Operation(summary = "Get a map (own or published)")
    @GetMapping("/{id}")
    public MapResponse get(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        return mapService.get(id, userId);
    }

    @Operation(summary = "Save a map (author only)")
    @PutMapping("/{id}")
    public MapResponse update(@PathVariable UUID id, @Valid @RequestBody MapRequest req,
                              @AuthenticationPrincipal UUID userId) {
        return mapService.update(id, userId, req);
    }

    @Operation(summary = "Delete a map (author only)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        mapService.delete(id, userId);
    }

    @Operation(summary = "Share the map in the community workshop (author only)")
    @PostMapping("/{id}/publish")
    public MapResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        return mapService.setPublished(id, userId, true);
    }

    @Operation(summary = "Remove the map from the community workshop (author only)")
    @PostMapping("/{id}/unpublish")
    public MapResponse unpublish(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        return mapService.setPublished(id, userId, false);
    }

    @Operation(summary = "Copy an own or published map into the caller's library")
    @PostMapping("/{id}/copy")
    @ResponseStatus(HttpStatus.CREATED)
    public MapResponse copy(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        return mapService.copy(id, userId);
    }
}
