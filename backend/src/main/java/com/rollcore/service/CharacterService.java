package com.rollcore.service;

import com.rollcore.dto.request.CharacterRequest;
import com.rollcore.dto.response.CharacterResponse;
import com.rollcore.entity.Character;
import com.rollcore.entity.User;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.CharacterRepository;
import com.rollcore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * CRUD service for D&D 5e character sheets — UC-02.
 *
 * <p>Server-side rule enforcement:
 * <ul>
 *   <li>AC = 10 + DEX modifier — UC-02 RN-01 (never trusted from the client).
 *   <li>Spell slots populated by {@link DndEngine} — UC-02 RN-04.
 *   <li>Class and race validated against SRD lists — DndEngine.CLASSES / RACES.
 * </ul>
 * Arquitetura §5.1.2 (service layer) / §4.1 (UC-02 engine impact).
 */
@Service
@RequiredArgsConstructor
public class CharacterService {

    private final CharacterRepository characterRepository;
    private final UserRepository      userRepository;
    private final DndEngine           engine;

    // ── List ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CharacterResponse> listByUser(UUID userId) {
        return characterRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(CharacterResponse::from)
                .toList();
    }

    // ── Get ───────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CharacterResponse getById(UUID characterId, UUID userId) {
        return CharacterResponse.from(findOwned(characterId, userId));
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public CharacterResponse create(CharacterRequest req, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        Character character = buildFrom(new Character(), req, user);
        characterRepository.save(character);
        return CharacterResponse.from(character);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Transactional
    public CharacterResponse update(UUID characterId, CharacterRequest req, UUID userId) {
        Character existing = findOwned(characterId, userId);
        buildFrom(existing, req, existing.getUser());
        characterRepository.save(existing);
        return CharacterResponse.from(existing);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(UUID characterId, UUID userId) {
        characterRepository.delete(findOwned(characterId, userId));
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    /**
     * Maps request fields onto the entity and applies server-side D&D rules.
     * Reused for both create and update to avoid duplication.
     */
    private Character buildFrom(Character entity, CharacterRequest req, User user) {
        entity.setUser(user);
        entity.setName(req.name());
        entity.setCharacterClass(req.characterClass());
        entity.setSubclass(req.subclass() != null ? req.subclass() : "");
        entity.setRace(req.race());
        entity.setLevel(req.level());
        entity.setAttributes(req.attributes());
        entity.setHp(req.hp());
        entity.setMaxHp(req.maxHp());
        entity.setTempHp(req.tempHp() != null ? req.tempHp() : 0);

        // AC = 10 + DEX modifier — UC-02 RN-01, computed server-side
        int dex = req.attributes().getOrDefault("DEX", 10);
        entity.setAc(10 + engine.calcMod(dex));

        // Spell slots computed server-side — UC-02 RN-04 / engine.ts mirrors.
        // Subclass is passed so Cavaleiro Arcano and Trapaceiro Arcano (1/3 casters)
        // receive the correct THIRD_CASTER_SLOTS table — mirrors resolveCasterType().
        String subclass = req.subclass() != null ? req.subclass() : "";
        entity.setSpellSlots(engine.getMaxSpellSlots(req.characterClass(), req.level(), subclass));
        entity.setWarlockSlots(engine.getWarlockSlots(req.characterClass(), req.level(), subclass));

        return entity;
    }

    /** Loads a character and verifies it belongs to the requesting user. */
    private Character findOwned(UUID characterId, UUID userId) {
        return characterRepository
                .findByIdAndUserId(characterId, userId)
                .orElseThrow(() -> {
                    // Return 404 whether the character doesn't exist or belongs to another user
                    // to avoid ownership enumeration
                    boolean exists = characterRepository.existsById(characterId);
                    if (exists) throw new ForbiddenException("Acesso negado ao personagem.");
                    return new NotFoundException("Personagem não encontrado.");
                });
    }
}