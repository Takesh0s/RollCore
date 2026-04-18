package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Persistent user account.
 * Mirrors the {@code users} table — Arquitetura §6.4 / UC-01.
 *
 * <p>email   → unique login identifier (UNIQUE constraint)
 * <p>username → unique public display name (UNIQUE constraint) — Sprint 6 / feat(types)
 * <p>passwordHash → BCrypt factor 12, never exposed in responses — UC-01 RN-01
 */
@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** Login identifier — UNIQUE, case-insensitive (stored lowercase). */
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /**
     * Public display name shown in dashboard and profile.
     * Format: 3–20 chars, [a-zA-Z0-9_] — mirrors RegisterScreen.tsx regex.
     * Doc. de Visão §9.2 — users.username UNIQUE constraint.
     */
    @Column(nullable = false, unique = true, length = 20)
    private String username;

    /** BCrypt hash, cost factor 12 — UC-01 RN-01 / RNF-03. */
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
