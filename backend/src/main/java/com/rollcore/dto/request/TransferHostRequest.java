package com.rollcore.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** New host (master) of the table; must already be a member. */
public record TransferHostRequest(
    @NotNull(message = "Usuário é obrigatório.")
    UUID userId
) {}
