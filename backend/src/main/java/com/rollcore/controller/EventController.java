package com.rollcore.controller;

import com.rollcore.dto.request.CreateEventRequest;
import com.rollcore.dto.request.RsvpRequest;
import com.rollcore.dto.response.EventResponse;
import com.rollcore.service.TableEventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Calendar of the game tables.
 *
 * <pre>
 * GET    /events                    → events of every table I belong to
 * POST   /tables/{tableId}/events   → schedule an event (master / moderator)
 * PUT    /events/{id}/rsvp          → answer YES / MAYBE / NO
 * DELETE /events/{id}               → delete (creator or master)
 * </pre>
 */
@Tag(name = "Events", description = "Table calendar and RSVP")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequiredArgsConstructor
public class EventController {

    private final TableEventService eventService;

    @Operation(summary = "List the events of every table the caller belongs to")
    @GetMapping("/events")
    public List<EventResponse> list(@AuthenticationPrincipal UUID userId) {
        return eventService.list(userId);
    }

    @Operation(summary = "Schedule an event in a table")
    @PostMapping("/tables/{tableId}/events")
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(
            @PathVariable UUID tableId,
            @Valid @RequestBody CreateEventRequest request,
            @AuthenticationPrincipal UUID userId) {
        return eventService.create(tableId, userId, request);
    }

    @Operation(summary = "Answer an event (YES, MAYBE or NO)")
    @PutMapping("/events/{id}/rsvp")
    public EventResponse respond(
            @PathVariable UUID id,
            @Valid @RequestBody RsvpRequest request,
            @AuthenticationPrincipal UUID userId) {
        return eventService.respond(id, userId, request);
    }

    @Operation(summary = "Delete an event (creator or table master)")
    @DeleteMapping("/events/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        eventService.delete(id, userId);
    }
}
