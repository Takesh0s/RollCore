package com.rollcore.repository;

import com.rollcore.entity.TableEventRsvp;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TableEventRsvpRepository extends JpaRepository<TableEventRsvp, UUID> {

    @EntityGraph(attributePaths = {"user"})
    List<TableEventRsvp> findByEventIdIn(Collection<UUID> eventIds);

    Optional<TableEventRsvp> findByEventIdAndUserId(UUID eventId, UUID userId);
}
