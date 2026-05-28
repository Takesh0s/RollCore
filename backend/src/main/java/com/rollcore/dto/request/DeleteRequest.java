package com.rollcore.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record DeleteRequest(
        @NotBlank
        UUID userID
) {
}
