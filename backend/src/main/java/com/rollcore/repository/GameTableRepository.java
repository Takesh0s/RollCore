package com.rollcore.repository;

import com.rollcore.entity.GameTable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface GameTableRepository extends JpaRepository<GameTable, UUID> {

    Optional<GameTable> findByInviteCode(String inviteCode);

    boolean existsByInviteCode(String inviteCode);

    long countByOwnerId(UUID ownerId);

    /** Row lock: serialises joins / edits so the player cap cannot be exceeded by a race. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from GameTable t where t.id = :id")
    Optional<GameTable> findByIdForUpdate(@Param("id") UUID id);
}
