package com.rollcore.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Password change. The new password follows the same rule as registration (UC-01 RN-01). */
public record ChangePasswordRequest(

    @NotBlank(message = "Senha atual é obrigatória.")
    String currentPassword,

    @NotBlank(message = "Nova senha é obrigatória.")
    @Size(min = 8, message = "Senha deve ter no mínimo 8 caracteres.")
    @Pattern(
        regexp  = "^(?=.*[A-Z])(?=.*\\d).+$",
        message = "Senha deve conter ao menos uma letra maiúscula e um número."
    )
    String newPassword
) {
    @AssertTrue(message = "A nova senha deve ser diferente da atual.")
    public boolean isNewPasswordDifferent() {
        return currentPassword == null || newPassword == null || !currentPassword.equals(newPassword);
    }
}
