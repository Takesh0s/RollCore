package com.rollcore.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.rollcore.entity.TableEvent;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Calendar event as the client renders it. {@code guests} are the usernames of every member of
 * the table; {@code rsvp} maps username → YES / MAYBE / NO (members absent from the map are pending).
 */
public record EventResponse(
    UUID    id,
    UUID    tableId,
    String  tableName,
    String  title,
    String  description,
    LocalDate date,
    @JsonFormat(pattern = "HH:mm") LocalTime start,
    @JsonFormat(pattern = "HH:mm") LocalTime end,
    String  repeat,
    String  color,
    boolean askRsvp,
    String  createdBy,
    List<String> guests,
    Map<String, String> rsvp
) {
    public static EventResponse from(TableEvent e, List<String> guests, Map<String, String> rsvp) {
        return new EventResponse(
            e.getId(),
            e.getGameTable().getId(),
            e.getGameTable().getName(),
            e.getTitle(),
            e.getDescription(),
            e.getEventDate(),
            e.getStartTime(),
            e.getEndTime(),
            e.getRepeat().name(),
            e.getColor().name(),
            e.isAskRsvp(),
            e.getCreatedBy().getUsername(),
            guests,
            rsvp);
    }
}
