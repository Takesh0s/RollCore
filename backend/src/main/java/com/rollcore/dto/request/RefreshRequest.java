package com.rollcore.dto.request;

import jakarta.validation.constraints.NotBlank;

/** Refresh token exchange — UC-01 S01. */
public record RefreshRequest(
    @NotBlank(message = "Refresh token é obrigatório.")
    String refreshToken
) {}
