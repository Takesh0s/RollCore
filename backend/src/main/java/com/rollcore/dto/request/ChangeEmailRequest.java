package com.rollcore.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Change of the sign-in e-mail; the current password proves it is really the owner. */
public record ChangeEmailRequest(

    @NotBlank(message = "Novo e-mail é obrigatório.")
    @Email(message = "Formato de e-mail inválido.")
    @Size(max = 255, message = "E-mail muito longo.")
    String newEmail,

    @NotBlank(message = "Senha atual é obrigatória.")
    String currentPassword
) {}
