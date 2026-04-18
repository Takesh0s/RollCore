package com.rollcore.repository;

import com.rollcore.entity.Character;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CharacterRepository extends JpaRepository<Character, UUID> {

    List<Character> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /** Ownership check — used before update/delete. */
    Optional<Character> findByIdAndUserId(UUID id, UUID userId);
}
