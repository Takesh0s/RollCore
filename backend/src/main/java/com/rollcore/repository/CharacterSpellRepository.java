package com.rollcore.repository;

import com.rollcore.entity.CharacterSpell;
import com.rollcore.entity.CharacterSpellId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/** Data access for the {@code character_spells} join table — Sprint 8. */
public interface CharacterSpellRepository extends JpaRepository<CharacterSpell, CharacterSpellId> {

    List<CharacterSpell> findByIdCharacterIdOrderByPositionAscSpellLevelAscSpellNameAsc(UUID characterId);

    void deleteByIdCharacterIdAndIdSpellId(UUID characterId, UUID spellId);

    boolean existsByIdCharacterIdAndIdSpellId(UUID characterId, UUID spellId);
}