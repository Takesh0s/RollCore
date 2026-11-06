package com.rollcore.dto.request;

import jakarta.validation.constraints.*;

import java.util.Map;

/**
 * Create / update character payload — UC-02.
 *
 * <p>Racial bonuses are already applied to the attribute values by the frontend
 * (CharacterFormScreen.tsx) before sending. The server stores the post-bonus values.
 * Spell slots are NOT sent — they are computed server-side by DndEngine.
 */
public record CharacterRequest(

    @NotBlank(message = "Nome é obrigatório.")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres.")
    String name,

    @NotBlank(message = "Classe é obrigatória.")
    String characterClass,

    /** Empty string when the character has not yet reached the subclass choice level. */
    String subclass,

    @NotBlank(message = "Raça é obrigatória.")
    String race,

    @Min(value = 1,  message = "Nível mínimo: 1.")
    @Max(value = 20, message = "Nível máximo: 20.")
    int level,

    /**
     * Six core attributes: {STR, DEX, CON, INT, WIS, CHA}.
     * Each value must be between 1 and 30 (racial bonuses can push beyond 20).
     */
    @NotNull(message = "Atributos são obrigatórios.")
    @Size(min = 6, max = 6, message = "Exatamente 6 atributos são necessários.")
    Map<String, Integer> attributes,

    @Min(value = 0, message = "HP não pode ser negativo.")
    int hp,

    @Min(value = 1, message = "HP máximo deve ser ao menos 1.")
    int maxHp,

    /** May be null (treated as 0). */
    Integer tempHp,

    /** Game system of the sheet. Null or blank is treated as "D&D 5e". */
    @Size(max = 50, message = "Sistema deve ter no máximo 50 caracteres.")
    String gameSystem,

    /** Portrait. Null keeps the current one; blank removes it. */
    @Size(max = 400_000, message = "A foto é grande demais.")
    @Pattern(
        regexp  = "^(data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+|https?://\\S+)?$",
        message = "A foto deve ser uma imagem (png, jpeg ou webp) ou uma URL http(s)."
    )
    String avatarUrl
) {
    /** Keeps the pre-system constructor working (system defaults to D&D 5e). */
    public CharacterRequest(String name, String characterClass, String subclass, String race,
                            int level, Map<String, Integer> attributes, int hp, int maxHp,
                            Integer tempHp) {
        this(name, characterClass, subclass, race, level, attributes, hp, maxHp, tempHp, null, null);
    }

    /** Keeps the pre-avatar constructor working (portrait untouched). */
    public CharacterRequest(String name, String characterClass, String subclass, String race,
                            int level, Map<String, Integer> attributes, int hp, int maxHp,
                            Integer tempHp, String gameSystem) {
        this(name, characterClass, subclass, race, level, attributes, hp, maxHp, tempHp, gameSystem, null);
    }
}
