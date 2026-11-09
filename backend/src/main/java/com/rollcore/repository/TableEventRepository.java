package com.rollcore.repository;

import com.rollcore.entity.TableEvent;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface TableEventRepository extends JpaRepository<TableEvent, UUID> {

    /** Events of the given tables, in calendar order (table and creator fetched). */
    @EntityGraph(attributePaths = {"gameTable", "createdBy"})
    List<TableEvent> findByGameTableIdInOrderByEventDateAscStartTimeAsc(Collection<UUID> tableIds);
}
