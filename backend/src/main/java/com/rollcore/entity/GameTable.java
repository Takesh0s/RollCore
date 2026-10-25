package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * A persistent RPG table ("mesa") — Fase 2a. Mirrors {@code game_tables} (migration V7).
 *
 * <p>The owner is always the member whose role is {@link GameTableMember.Role#MASTER}.
 * Players join with {@link #inviteCode}.
 */
@Entity
@Table(name = "game_tables")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GameTable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 100)
    private String name;

    /** Rule system, e.g. "D&D 5e" (Figma: field "Sistema"). */
    @Column(name = "game_system", nullable = false, length = 50)
    private String gameSystem;

    @Column(length = 2000)
    private String description;

    @Column(name = "max_players", nullable = false)
    private int maxPlayers;

    /** Optional cover image URL (http/https). File upload is a later phase. */
    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    /** Short code players use to join. UNIQUE; regenerable by the master. */
    @Column(name = "invite_code", nullable = false, unique = true, length = 10)
    private String inviteCode;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
