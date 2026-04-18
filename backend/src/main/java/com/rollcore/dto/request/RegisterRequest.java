package com.rollcore.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Registration payload — UC-01 §3.1 / RegisterScreen.tsx validation mirrors.
 *
 * <p>Username regex: 3–20 chars, [a-zA-Z0-9_] — matches frontend /^[a-zA-Z0-9_]{3,20}$/.
 * Password: min 8 chars, ≥1 uppercase, ≥1 digit — UC-01 RN-01.
 */
public record RegisterRequest(

    @NotBlank(message = "Username é obrigatório.")
    @Pattern(
        regexp  = "^[a-zA-Z0-9_]{3,20}$",
        message = "Username deve ter 3–20 caracteres: letras, números ou _."
    )
    String username,

    @NotBlank(message = "E-mail é obrigatório.")
    @Email(message = "Formato de e-mail inválido.")
    String email,

    @NotBlank(message = "Senha é obrigatória.")
    @Size(min = 8, message = "Senha deve ter no mínimo 8 caracteres.")
    @Pattern(
        regexp  = "^(?=.*[A-Z])(?=.*\\d).+$",
        message = "Senha deve conter ao menos uma letra maiúscula e um número."
    )
    String password
) {}
