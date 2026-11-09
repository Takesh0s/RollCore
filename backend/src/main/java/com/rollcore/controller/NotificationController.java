package com.rollcore.controller;

import com.rollcore.dto.response.NotificationListResponse;
import com.rollcore.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * In-app notifications of the caller.
 *
 * <pre>
 * GET  /notifications            → latest 50 + unread total
 * POST /notifications/{id}/read  → mark one as read
 * POST /notifications/read-all   → mark all as read
 * </pre>
 */
@Tag(name = "Notifications", description = "In-app notifications")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "List the latest notifications and the unread total")
    @GetMapping
    public NotificationListResponse list(@AuthenticationPrincipal UUID userId) {
        return notificationService.list(userId);
    }

    @Operation(summary = "Mark one notification as read")
    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        notificationService.markRead(id, userId);
    }

    @Operation(summary = "Mark every notification as read")
    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@AuthenticationPrincipal UUID userId) {
        notificationService.markAllRead(userId);
    }
}
