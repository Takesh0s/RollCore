package com.rollcore.live;

import com.rollcore.dto.request.RollRequest;
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
 * HTTP side of a live table. Same rules as the WebSocket channel; useful for clients that
 * only need history or cannot hold a socket, and for scripts.
 *
 * <pre>
 * POST /tables/{id}/rolls     → roll in the table (also broadcast to subscribers)
 * GET  /tables/{id}/rolls     → latest rolls, newest first (?limit=1..100, default 50)
 * GET  /tables/{id}/presence  → members currently connected
 * </pre>
 */
@Tag(name = "Live session", description = "Shared dice rolls and presence of a table")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/tables/{tableId}")
@RequiredArgsConstructor
public class TableSessionController {

    private final TableSessionService sessions;

    @Operation(summary = "Roll dice in a table; the result is broadcast to its members")
    @PostMapping("/rolls")
    @ResponseStatus(HttpStatus.CREATED)
    public TableRollEvent roll(@AuthenticationPrincipal UUID userId,
                               @PathVariable UUID tableId,
                               @Valid @RequestBody RollRequest request) {
        return sessions.roll(tableId, userId, request);
    }

    @Operation(summary = "Latest rolls made in the table, newest first")
    @GetMapping("/rolls")
    public List<TableRollEvent> history(@AuthenticationPrincipal UUID userId,
                                        @PathVariable UUID tableId,
                                        @RequestParam(required = false) Integer limit) {
        return sessions.history(tableId, userId, limit);
    }

    @Operation(summary = "Members currently connected to the table")
    @GetMapping("/presence")
    public PresenceEvent presence(@AuthenticationPrincipal UUID userId, @PathVariable UUID tableId) {
        return sessions.presence(tableId, userId);
    }
}
