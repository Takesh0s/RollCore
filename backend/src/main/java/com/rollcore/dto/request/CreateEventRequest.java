package com.rollcore.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.rollcore.entity.TableEvent.Color;
import com.rollcore.entity.TableEvent.Repeat;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

/** "Criar evento" payload. Times are {@code HH:mm}; {@code repeat} and {@code color} default when omitted. */
public record CreateEventRequest(

    @NotBlank(message = "Nome do evento é obrigatório.")
    @Size(min = 3, max = 100, message = "Nome deve ter de 3 a 100 caracteres.")
    String title,

    @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres.")
    String description,

    @NotNull(message = "Data é obrigatória.")
    LocalDate date,

    @NotNull(message = "Início é obrigatório.")
    @JsonFormat(pattern = "HH:mm")
    LocalTime start,

    @NotNull(message = "Fim é obrigatório.")
    @JsonFormat(pattern = "HH:mm")
    LocalTime end,

    Repeat repeat,
    Color color,
    Boolean askRsvp
) {
    @AssertTrue(message = "O fim deve ser depois do início.")
    public boolean isEndAfterStart() {
        return start == null || end == null || end.isAfter(start);
    }
}
