package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/** A member's answer to a {@link TableEvent}. Mirrors {@code table_event_rsvps} (migration V16). */
@Entity
@Table(name = "table_event_rsvps")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TableEventRsvp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private TableEvent event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Status status;

    @UpdateTimestamp
    @Column(name = "responded_at", nullable = false)
    private Instant respondedAt;

    public enum Status { YES, MAYBE, NO }
}
