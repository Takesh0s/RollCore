package com.rollcore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Dice roll payload — UC-03 §3.1. */
public record RollRequest(

    /**
     * Formula in NdX | NdX+M | NdX-M format — UC-03 RN-01.
     * Detailed validation is done in DiceService (regex + valid sides check).
     */
    @NotBlank(message = "Fórmula é obrigatória.")
    @Size(max = 50, message = "Fórmula deve ter no máximo 50 caracteres.")
    String formula,

    /** Optional reason shown with the result (e.g. "Ataque com espada longa"). */
    @Size(max = 80, message = "O motivo deve ter no máximo 80 caracteres.")
    String label,

    /** normal (default) | advantage | disadvantage. */
    @Pattern(regexp = "normal|advantage|disadvantage", message = "Modo inválido.")
    String mode
) {
    /** Plain roll: no label, normal mode. */
    public RollRequest(String formula) {
        this(formula, null, null);
    }
}
