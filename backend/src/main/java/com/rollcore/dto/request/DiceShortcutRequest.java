package com.rollcore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Payload to save a dice shortcut. The formula is validated in the service. */
public record DiceShortcutRequest(

    @NotBlank(message = "Nome é obrigatório.")
    @Size(max = 40, message = "O nome deve ter no máximo 40 caracteres.")
    String name,

    @NotBlank(message = "Fórmula é obrigatória.")
    @Size(max = 50, message = "Fórmula deve ter no máximo 50 caracteres.")
    String formula
) {}
