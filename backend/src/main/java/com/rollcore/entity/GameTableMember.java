package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Membership of a user in a {@link GameTable} — Fase 2a.
 * Mirrors {@code game_table_members} (migration V7).
 *
 * <p>{@code displayName} / {@code avatarUrl} are per-table overrides of the global
 * profile (Figma: "Perfil da Mesa"). {@code muted} silences this table's notifications.
 */
@Entity
@Table(name = "game_table_members")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GameTableMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_table_id", nullable = false)
    private GameTable gameTable;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "display_name", length = 50)
    private String displayName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(nullable = false)
    private boolean muted;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    /** MASTER = owner (GM); MODERATOR = "Moderador assistente"; PLAYER = regular member. */
    public enum Role { MASTER, MODERATOR, PLAYER }
}
