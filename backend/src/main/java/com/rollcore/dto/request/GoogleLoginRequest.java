package com.rollcore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Google sign-in payload: the ID token issued to the client by Google. */
public record GoogleLoginRequest(

    @NotBlank(message = "idToken é obrigatório.")
    @Size(max = 4096, message = "idToken inválido.")
    String idToken
) {}
