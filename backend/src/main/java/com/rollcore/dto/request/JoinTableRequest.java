package com.rollcore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** "Ingressar Mesa" payload. */
public record JoinTableRequest(
    @NotBlank(message = "Código de convite é obrigatório.")
    @Size(max = 10, message = "Código de convite inválido.")
    String inviteCode
) {}
