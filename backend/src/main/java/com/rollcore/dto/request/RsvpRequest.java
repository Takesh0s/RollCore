package com.rollcore.dto.request;

import com.rollcore.entity.TableEventRsvp.Status;
import jakarta.validation.constraints.NotNull;

/** The caller's answer to an event: YES, MAYBE or NO. */
public record RsvpRequest(
    @NotNull(message = "Resposta é obrigatória.")
    Status status
) {}
