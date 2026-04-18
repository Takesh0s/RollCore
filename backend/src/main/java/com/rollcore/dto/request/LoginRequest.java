package com.rollcore.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Login payload — UC-01 §3.1 (fluxo básico de login). */
public record LoginRequest(

    @NotBlank(message = "E-mail é obrigatório.")
    @Email(message = "Formato de e-mail inválido.")
    String email,

    @NotBlank(message = "Senha é obrigatória.")
    String password
) {}
