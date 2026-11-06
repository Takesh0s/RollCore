package com.rollcore.controller;

import com.rollcore.dto.request.DiceShortcutRequest;
import com.rollcore.dto.request.RollRequest;
import com.rollcore.dto.request.SaveRollRequest;
import com.rollcore.dto.response.DiceShortcutResponse;
import com.rollcore.dto.response.RollResponse;
import com.rollcore.service.DiceService;
import com.rollcore.service.DiceShortcutService;
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
 * Dice rolling endpoints — UC-03.
 *
 * <pre>
 * POST /dice/roll     → roll dice formula, persist and return result
 * GET  /dice/history  → last 50 rolls for the authenticated user (optional ?tableId=)
 * GET/POST/DELETE /dice/shortcuts → saved dice formulas
 * </pre>
 *
 * Rolling is processed server-side with {@link java.security.SecureRandom}
 * to guarantee result integrity — UC-03 RE-01.
 */
@Tag(name = "Dice", description = "Virtual dice rolling — UC-03")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/dice")
@RequiredArgsConstructor
public class DiceController {

    private final DiceService         diceService;
    private final DiceShortcutService shortcutService;

    @Operation(summary = "Roll dice with formula NdX+M — UC-03 §3.1")
    @PostMapping("/roll")
    @ResponseStatus(HttpStatus.CREATED)
    public RollResponse roll(
            @Valid @RequestBody RollRequest request,
            @AuthenticationPrincipal UUID userId) {
        return diceService.roll(userId, request);
    }


    @Operation(summary = "Persist a pre-calculated roll result without rerolling")
    @PostMapping("/save")
    @ResponseStatus(HttpStatus.CREATED)
    public RollResponse save(
            @Valid @RequestBody SaveRollRequest request,
            @AuthenticationPrincipal UUID userId) {
        return diceService.save(userId, request);
    }

    @Operation(summary = "Get history of the last 50 rolls — UC-03 S02 / RN-04")
    @GetMapping("/history")
    public List<RollResponse> history(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(required = false) UUID tableId) {
        return diceService.getHistory(userId, tableId);
    }

    @Operation(summary = "List the caller's saved dice shortcuts")
    @GetMapping("/shortcuts")
    public List<DiceShortcutResponse> shortcuts(@AuthenticationPrincipal UUID userId) {
        return shortcutService.list(userId);
    }

    @Operation(summary = "Save a dice shortcut (max 12 per user)")
    @PostMapping("/shortcuts")
    @ResponseStatus(HttpStatus.CREATED)
    public DiceShortcutResponse createShortcut(
            @Valid @RequestBody DiceShortcutRequest request,
            @AuthenticationPrincipal UUID userId) {
        return shortcutService.create(userId, request);
    }

    @Operation(summary = "Delete one of the caller's dice shortcuts")
    @DeleteMapping("/shortcuts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteShortcut(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        shortcutService.delete(userId, id);
    }
}