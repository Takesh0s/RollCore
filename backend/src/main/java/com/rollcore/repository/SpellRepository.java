package com.rollcore.repository;

import com.rollcore.entity.Spell;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/** Data access for the {@code spells} master catalog — Sprint 8. */
public interface SpellRepository extends JpaRepository<Spell, UUID> {

    /**
     * Filters spells by class name (exact match inside the TEXT[] array).
     * Uses the GIN index on classes column — Arquitetura §6.3.
     */
    @Query(value = "SELECT * FROM spells WHERE :className = ANY(classes) ORDER BY level, name", nativeQuery = true)
    List<Spell> findByClassName(@Param("className") String className);

    /** Filters by class and spell level. */
    @Query(value = "SELECT * FROM spells WHERE :className = ANY(classes) AND level = :level ORDER BY name", nativeQuery = true)
    List<Spell> findByClassNameAndLevel(@Param("className") String className, @Param("level") int level);

    /**
     * Full-text + ILIKE search across spell name.
     * Frontend search bar calls GET /spells?search=fireball
     */
    @Query(value = "SELECT * FROM spells WHERE name ILIKE '%' || :query || '%' ORDER BY level, name LIMIT 50", nativeQuery = true)
    List<Spell> searchByName(@Param("query") String query);

    /**
     * Combined filter: class + optional level + optional name search.
     * Used by GET /spells?class=Mago&level=3&search=bola
     */
    @Query(value = """
            SELECT * FROM spells
            WHERE (:className IS NULL OR :className = ANY(classes))
              AND (:level     IS NULL OR level = :level)
              AND (:search    IS NULL OR name ILIKE '%' || :search || '%')
            ORDER BY level, name
            LIMIT 100
            """, nativeQuery = true)
    List<Spell> filter(
            @Param("className") String className,
            @Param("level")     Integer level,
            @Param("search")    String search);
}