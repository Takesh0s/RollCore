package com.rollcore.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * "Criação de Mesa" payload (Figma). Optional fields may be omitted:
 * system defaults to "D&D 5e" and maxPlayers to 5.
 */
public record CreateTableRequest(

    @NotBlank(message = "Nome da campanha é obrigatório.")
    @Size(min = 3, max = 100, message = "Nome deve ter de 3 a 100 caracteres.")
    String name,

    @Size(max = 50, message = "Sistema deve ter no máximo 50 caracteres.")
    String gameSystem,

    @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres.")
    String description,

    @Min(value = 1, message = "A mesa precisa de ao menos 1 jogador.")
    @Max(value = 20, message = "A mesa aceita no máximo 20 jogadores.")
    Integer maxPlayers,

    @Size(max = 500, message = "URL da capa deve ter no máximo 500 caracteres.")
    @Pattern(regexp = "^https?://\\S+$", message = "A capa deve ser uma URL http(s).")
    String coverUrl
) {}
