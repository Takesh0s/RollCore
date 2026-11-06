package com.rollcore.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/** Create/update payload for an inventory item. */
public record ItemRequest(

    @NotBlank(message = "Nome é obrigatório.")
    @Size(max = 80, message = "O nome deve ter no máximo 80 caracteres.")
    String name,

    /** weapon | armor | consumable | other (default other). */
    @Pattern(regexp = "weapon|armor|consumable|other", message = "Categoria inválida.")
    String category,

    @NotNull(message = "Quantidade é obrigatória.")
    @Min(value = 0, message = "A quantidade não pode ser negativa.")
    @Max(value = 9999, message = "A quantidade máxima é 9999.")
    Integer quantity,

    /** Weight per unit, in kg. */
    @DecimalMin(value = "0", message = "O peso não pode ser negativo.")
    @DecimalMax(value = "99999.99", message = "Peso muito alto.")
    @Digits(integer = 5, fraction = 2, message = "Use no máximo 2 casas decimais.")
    BigDecimal weight,

    @Size(max = 40, message = "Dano/CA deve ter no máximo 40 caracteres.")
    String damage,

    @Size(max = 500, message = "A descrição deve ter no máximo 500 caracteres.")
    String description
) {}
