package com.rollcore.repository;

import com.rollcore.entity.DiceShortcut;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DiceShortcutRepository extends JpaRepository<DiceShortcut, UUID> {

    List<DiceShortcut> findByUserIdOrderByCreatedAtAsc(UUID userId);

    long countByUserId(UUID userId);

    Optional<DiceShortcut> findByIdAndUserId(UUID id, UUID userId);
}
