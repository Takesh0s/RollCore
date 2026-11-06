package com.rollcore.repository;

import com.rollcore.entity.CharacterItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CharacterItemRepository extends JpaRepository<CharacterItem, UUID> {

    List<CharacterItem> findByCharacterIdOrderByCreatedAtAsc(UUID characterId);

    long countByCharacterId(UUID characterId);

    Optional<CharacterItem> findByIdAndCharacterId(UUID id, UUID characterId);
}
