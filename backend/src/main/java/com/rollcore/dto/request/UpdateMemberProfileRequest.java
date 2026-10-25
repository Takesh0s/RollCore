package com.rollcore.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * "Perfil da Mesa" payload — partial update: only non-null fields are applied.
 * An empty string for {@code displayName} / {@code avatarUrl} clears the override
 * (the global profile is shown again).
 */
public record UpdateMemberProfileRequest(

    @Size(max = 50, message = "Nome de exibição deve ter no máximo 50 caracteres.")
    String displayName,

    @Size(max = 500, message = "URL do avatar deve ter no máximo 500 caracteres.")
    @Pattern(regexp = "^(https?://\\S+)?$", message = "O avatar deve ser uma URL http(s).")
    String avatarUrl,

    Boolean muted
) {}
