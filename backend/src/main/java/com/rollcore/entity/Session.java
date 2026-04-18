package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Virtual RPG session room — scaffold for Fase 2 (UC-04 / WebSocket).
 * Mirrors the {@code sessions} table — Arquitetura §6.4.
 *
 * <p>Active in-memory room state will be kept in Redis 7 (Fase 2).
 * The entity is created now so {@code dice_rolls.session_id} FK is valid.
 */
@Entity
@Table(name = "sessions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** Short code shared with players to join the room. UNIQUE constraint. */
    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "master_user_id", nullable = false)
    private User master;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum Status { ACTIVE, CLOSED }
}
