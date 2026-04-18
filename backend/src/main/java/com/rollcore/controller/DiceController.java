package com.rollcore.controller;

import com.rollcore.dto.request.RollRequest;
import com.rollcore.dto.response.RollResponse;
import com.rollcore.service.DiceService;
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
 * GET  /dice/history  → last 50 rolls for the authenticated user
 * </pre>
 *
 * Rolling is processed server-side with {@link java.security.SecureRandom}
 * to guarantee result integrity — UC-03 RE-01.
 */
@Tag(name = "Dice", description = "Rolagem de dados virtuais — UC-03")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/dice")
@RequiredArgsConstructor
public class DiceController {

    private final DiceService diceService;

    @Operation(summary = "Rolar dados com fórmula NdX+M — UC-03 §3.1")
    @PostMapping("/roll")
    @ResponseStatus(HttpStatus.CREATED)
    public RollResponse roll(
            @Valid @RequestBody RollRequest request,
            @AuthenticationPrincipal UUID userId) {
        return diceService.roll(userId, request);
    }

    @Operation(summary = "Histórico das últimas 50 rolagens — UC-03 S02 / RN-04")
    @GetMapping("/history")
    public List<RollResponse> history(@AuthenticationPrincipal UUID userId) {
        return diceService.getHistory(userId);
    }
}
