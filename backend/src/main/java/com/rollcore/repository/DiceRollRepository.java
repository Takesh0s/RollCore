package com.rollcore.repository;

import com.rollcore.entity.DiceRoll;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DiceRollRepository extends JpaRepository<DiceRoll, UUID> {

    /**
     * History query — UC-03 S02 / RN-04.
     * Caller passes {@code PageRequest.of(0, 50)} to get the last 50 rolls.
     */
    Page<DiceRoll> findByUserIdOrderByRolledAtDesc(UUID userId, Pageable pageable);
}
