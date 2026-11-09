package com.rollcore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * A scheduled event of a {@link GameTable} (calendar). Mirrors {@code table_events} (migration V16).
 * Date and times are wall-clock values with no time zone; repetition is expanded by the client.
 */
@Entity
@Table(name = "table_events")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TableEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_table_id", nullable = false)
    private GameTable gameTable;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "repeat_rule", nullable = false, length = 20)
    @Builder.Default
    private Repeat repeat = Repeat.NONE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Color color = Color.BLUE;

    @Column(name = "ask_rsvp", nullable = false)
    @Builder.Default
    private boolean askRsvp = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum Repeat { NONE, WEEKLY, BIWEEKLY, MONTHLY }

    public enum Color { RED, BLUE, GREEN, AMBER, TEAL, PURPLE }
}
