package com.rollcore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Promote to "Moderador assistente" or demote to player. MASTER cannot be assigned here. */
public record ChangeRoleRequest(
    @NotBlank(message = "Cargo é obrigatório.")
    @Pattern(regexp = "MODERATOR|PLAYER", message = "Cargo deve ser MODERATOR ou PLAYER.")
    String role
) {}
