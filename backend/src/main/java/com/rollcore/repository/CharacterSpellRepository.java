package com.rollcore.repository;

import com.rollcore.entity.CharacterSpell;
import com.rollcore.entity.CharacterSpellId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/** Data access for the {@code character_spells} join table — Sprint 8. */
public interface CharacterSpellRepository extends JpaRepository<CharacterSpell, CharacterSpellId> {

    /**
     * Returns all spells known by a character ordered by position, spell level,
     * then spell name. Uses a native query because Spring Data cannot navigate
     * the JOIN to spells.level / spells.name through a derived method name.
     */
    @Query(value = """
            SELECT cs.* FROM character_spells cs
            JOIN spells s ON s.id = cs.spell_id
            WHERE cs.character_id = :characterId
            ORDER BY cs.position ASC, s.level ASC, s.name ASC
            """, nativeQuery = true)
    List<CharacterSpell> findByIdCharacterIdOrderByPositionAscSpellLevelAscSpellNameAsc(
            @Param("characterId") UUID characterId);

    void deleteByIdCharacterIdAndIdSpellId(UUID characterId, UUID spellId);

    boolean existsByIdCharacterIdAndIdSpellId(UUID characterId, UUID spellId);
}