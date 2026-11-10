package com.rollcore.dto.request;

import com.rollcore.entity.GameMap.GridType;
import com.rollcore.entity.GameMap.Kind;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Create / save a map. {@code layers} is the JSON document with the painted terrain and the
 * revealed fog (see migration V20); {@code imageId} is a picture uploaded through {@code POST /images}.
 */
public record MapRequest(

    @NotBlank(message = "Nome do mapa é obrigatório.")
    @Size(min = 3, max = 100, message = "Nome deve ter de 3 a 100 caracteres.")
    String name,

    @NotNull(message = "Tipo do mapa é obrigatório.")
    Kind kind,

    @NotNull(message = "Formato da grade é obrigatório.")
    GridType gridType,

    @NotNull(message = "Colunas são obrigatórias.")
    @Min(value = 5, message = "O mapa precisa de pelo menos 5 colunas.")
    @Max(value = 100, message = "O mapa pode ter no máximo 100 colunas.")
    Integer cols,

    @NotNull(message = "Linhas são obrigatórias.")
    @Min(value = 5, message = "O mapa precisa de pelo menos 5 linhas.")
    @Max(value = 100, message = "O mapa pode ter no máximo 100 linhas.")
    Integer rows,

    @NotNull(message = "Tamanho da célula é obrigatório.")
    @Min(value = 16, message = "A célula deve ter de 16 a 128 pixels.")
    @Max(value = 128, message = "A célula deve ter de 16 a 128 pixels.")
    Integer cellSize,

    UUID imageId,
    String layers,
    Boolean gridVisible,
    Boolean fogEnabled
) {}
