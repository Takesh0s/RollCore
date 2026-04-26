package com.rollcore.service;

import com.rollcore.dto.response.SpellResponse;
import com.rollcore.entity.Character;
import com.rollcore.entity.CharacterSpell;
import com.rollcore.entity.CharacterSpellId;
import com.rollcore.entity.Spell;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.CharacterRepository;
import com.rollcore.repository.CharacterSpellRepository;
import com.rollcore.repository.SpellRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Spell catalog queries and character-spell management.
 * Sprint 8 — Compêndio de Magias.
 */
@Service
@RequiredArgsConstructor
public class SpellService {

    private final SpellRepository          spellRepository;
    private final CharacterSpellRepository characterSpellRepository;
    private final CharacterRepository      characterRepository;

    // ── Catalog ───────────────────────────────────────────────────────────────

    /**
     * Filtered spell list — drives GET /spells?class=&level=&search=
     * All params are optional; pass null to skip that filter.
     */
    @Transactional(readOnly = true)
    public List<SpellResponse> filter(String className, Integer level, String search) {
        String classParam  = (className != null && !className.isBlank()) ? className : null;
        Integer levelParam = level;
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;

        return spellRepository.filter(classParam, levelParam, searchParam)
                .stream().map(SpellResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public SpellResponse getById(UUID spellId) {
        return SpellResponse.from(findSpell(spellId));
    }

    // ── Character spells ──────────────────────────────────────────────────────

    /** Returns all spells a character knows, ordered by position then level. */
    @Transactional(readOnly = true)
    public List<SpellResponse> listForCharacter(UUID characterId, UUID userId) {
        verifyOwnership(characterId, userId);
        return characterSpellRepository
                .findByIdCharacterIdOrderByPositionAscSpellLevelAscSpellNameAsc(characterId)
                .stream()
                .map(cs -> SpellResponse.from(cs.getSpell()))
                .toList();
    }

    /**
     * Adds a spell to a character's known/prepared list.
     *
     * @throws ConflictException  if the character already knows this spell.
     * @throws ForbiddenException if the character doesn't belong to the user.
     */
    @Transactional
    public SpellResponse addToCharacter(UUID characterId, UUID spellId, UUID userId) {
        Character character = verifyOwnership(characterId, userId);
        Spell     spell     = findSpell(spellId);

        if (characterSpellRepository.existsByIdCharacterIdAndIdSpellId(characterId, spellId)) {
            throw new ConflictException("Personagem já conhece essa magia.");
        }

        CharacterSpell cs = CharacterSpell.builder()
                .id(new CharacterSpellId(characterId, spellId))
                .character(character)
                .spell(spell)
                .build();

        characterSpellRepository.save(cs);
        return SpellResponse.from(spell);
    }

    /**
     * Removes a spell from a character's list.
     *
     * @throws NotFoundException  if the character doesn't have this spell.
     * @throws ForbiddenException if the character doesn't belong to the user.
     */
    @Transactional
    public void removeFromCharacter(UUID characterId, UUID spellId, UUID userId) {
        verifyOwnership(characterId, userId);

        if (!characterSpellRepository.existsByIdCharacterIdAndIdSpellId(characterId, spellId)) {
            throw new NotFoundException("Magia não encontrada na lista do personagem.");
        }

        characterSpellRepository.deleteByIdCharacterIdAndIdSpellId(characterId, spellId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Spell findSpell(UUID id) {
        return spellRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Magia não encontrada."));
    }

    private Character verifyOwnership(UUID characterId, UUID userId) {
        return characterRepository.findByIdAndUserId(characterId, userId)
                .orElseThrow(() -> {
                    boolean exists = characterRepository.existsById(characterId);
                    if (exists) throw new ForbiddenException("Acesso negado ao personagem.");
                    return new NotFoundException("Personagem não encontrado.");
                });
    }
}