package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * A battle map of the GM tools. Mirrors {@code game_maps} (migration V20).
 *
 * <p>{@link #layers} is a JSON document owned by the clients (painted terrain and revealed fog);
 * the server only checks that it is a JSON object of bounded size.
 */
@Entity
@Table(name = "game_maps")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GameMap {

    public enum Kind { MEDIEVAL, STEAMPUNK, CYBERPUNK, WESTERN, PIRATE, MODERN }

    public enum GridType { SQUARE, HEX }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Kind kind;

    @Enumerated(EnumType.STRING)
    @Column(name = "grid_type", nullable = false, length = 10)
    private GridType gridType;

    @Column(name = "grid_cols", nullable = false)
    private int cols;

    @Column(name = "grid_rows", nullable = false)
    private int rows;

    /** Width of one cell in pixels (the editor draws the map at cols x cellSize by rows x cellSize). */
    @Column(name = "cell_size", nullable = false)
    private int cellSize;

    /** Background picture ({@code /images/{id}}); null for a blank map. Not a FK object on purpose: copies share it. */
    @Column(name = "image_id")
    private UUID imageId;

    @Column(nullable = false, columnDefinition = "text")
    @Builder.Default
    private String layers = "{}";

    @Column(name = "grid_visible", nullable = false)
    @Builder.Default
    private boolean gridVisible = true;

    @Column(name = "fog_enabled", nullable = false)
    private boolean fogEnabled;

    @Column(nullable = false)
    private boolean published;

    @Column(name = "published_at")
    private Instant publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
