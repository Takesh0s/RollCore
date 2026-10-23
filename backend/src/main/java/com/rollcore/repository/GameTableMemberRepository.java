package com.rollcore.repository;

import com.rollcore.entity.GameTableMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GameTableMemberRepository extends JpaRepository<GameTableMember, UUID> {

    Optional<GameTableMember> findByGameTableIdAndUserId(UUID gameTableId, UUID userId);

    /** Tables the user belongs to, newest membership first (table + owner fetched). */
    @EntityGraph(attributePaths = {"gameTable", "gameTable.owner"})
    List<GameTableMember> findByUserIdOrderByJoinedAtDesc(UUID userId);

    /** Members of a table with their user loaded, oldest first. */
    @EntityGraph(attributePaths = {"user"})
    List<GameTableMember> findByGameTableIdOrderByJoinedAtAsc(UUID gameTableId);

    long countByGameTableId(UUID gameTableId);

    /** Removes every membership of a table (loaded and deleted one by one so the persistence context stays consistent). */
    void deleteByGameTableId(UUID gameTableId);

    /** Rows of {@code [gameTableId, count]} for the given tables. */
    @Query("select m.gameTable.id, count(m) from GameTableMember m "
         + "where m.gameTable.id in :ids group by m.gameTable.id")
    List<Object[]> countByGameTableIds(@Param("ids") Collection<UUID> ids);
}
