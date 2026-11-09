package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * An in-app notification for one user. Mirrors {@code notifications} (migration V18).
 *
 * <p>The clients render the message from {@link #type} plus the snapshot fields, so the row
 * stays meaningful after the table is deleted ({@code tableId} then points to nothing and is null
 * for the types that revoke access).
 */
@Entity
@Table(name = "notifications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Type type;

    @Column(name = "table_id")
    private UUID tableId;

    @Column(name = "table_name", length = 100)
    private String tableName;

    @Column(name = "actor_name", length = 50)
    private String actorName;

    /** Extra text: the new role for ROLE_CHANGED, the event title for EVENT_CREATED. */
    @Column(length = 200)
    private String detail;

    @Column(name = "read_at")
    private Instant readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum Type {
        MEMBER_JOINED, MEMBER_LEFT, ROLE_CHANGED, REMOVED_FROM_TABLE,
        HOST_TRANSFERRED, TABLE_DELETED, EVENT_CREATED
    }
}
