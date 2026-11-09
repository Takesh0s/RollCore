package com.rollcore.dto.response;

import java.util.List;

/** The latest notifications plus the total of unread ones (which may exceed the listed page). */
public record NotificationListResponse(List<NotificationResponse> items, long unread) {}
