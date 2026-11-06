package com.rollcore.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Partial update of the signed-in user's profile. A {@code null} field is left untouched;
 * an empty {@code avatarUrl} removes the photo.
 */
public record UpdateProfileRequest(

    @Pattern(
        regexp  = "^[a-zA-Z0-9_]{3,20}$",
        message = "Username deve ter 3–20 caracteres: letras, números ou _."
    )
    String username,

    @Size(max = 400_000, message = "A foto é grande demais.")
    @Pattern(
        regexp  = "^(data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+|https?://\\S+)?$",
        message = "A foto deve ser uma imagem (png, jpeg ou webp) ou uma URL http(s)."
    )
    String avatarUrl
) {}
