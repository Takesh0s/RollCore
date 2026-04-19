package com.rollcore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Payload for POST /dice/save — persists a roll already calculated client-side.
 *
 * Unlike POST /dice/roll (which re-rolls server-side with SecureRandom),
 * this endpoint trusts the client result and just stores it.
 * Used so the history is consistent across devices (PC, mobile, etc.)
 * with the exact values the player saw on screen.
 */
public record SaveRollRequest(

    @NotBlank(message = "Fórmula é obrigatória.")
    @Size(max = 50)
    String formula,

    /** Individual die results e.g. [4, 2] for 2d6. */
    @NotNull(message = "Resultados individuais são obrigatórios.")
    List<Integer> rolls,

    /** Sum of all dice + modifier — pre-computed by frontend. */
    int total,

    /** Modifier extracted from formula e.g. +3, -1, or 0. */
    int mod
) {}