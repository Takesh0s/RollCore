package com.rollcore.repository;

import com.rollcore.entity.GameMap;
import com.rollcore.entity.GameMap.Kind;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface GameMapRepository extends JpaRepository<GameMap, UUID> {

    /** The caller's library, most recently edited first. */
    @Query("select m from GameMap m join fetch m.owner where m.owner.id = :ownerId order by m.updatedAt desc")
    List<GameMap> findMine(@Param("ownerId") UUID ownerId);

    long countByOwnerId(UUID ownerId);

    /** Whether any map still uses this background picture (copies share it). */
    boolean existsByImageId(UUID imageId);

    /** Community workshop: published maps whose name contains {@code q} (use "" for all), newest first. */
    @Query("""
            select m from GameMap m join fetch m.owner
            where m.published = true and lower(m.name) like lower(concat('%', :q, '%'))
            order by m.publishedAt desc""")
    List<GameMap> searchPublished(@Param("q") String q, Pageable page);

    @Query("""
            select m from GameMap m join fetch m.owner
            where m.published = true and m.kind = :kind and lower(m.name) like lower(concat('%', :q, '%'))
            order by m.publishedAt desc""")
    List<GameMap> searchPublishedByKind(@Param("kind") Kind kind, @Param("q") String q, Pageable page);
}
