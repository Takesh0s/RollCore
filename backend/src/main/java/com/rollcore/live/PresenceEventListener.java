package com.rollcore.live;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import java.security.Principal;
import java.util.Set;
import java.util.UUID;

/**
 * Turns STOMP lifecycle events into presence changes. A user counts as online in a
 * table while they hold a subscription to that table's presence topic.
 */
@Component
@RequiredArgsConstructor
public class PresenceEventListener {

    private final PresenceService     presence;
    private final TableSessionService sessions;

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();
        Principal user = event.getUser() != null ? event.getUser() : accessor.getUser();

        if (!Destinations.isPresenceTopic(destination) || user == null
                || accessor.getSessionId() == null || accessor.getSubscriptionId() == null) {
            return;
        }
        UUID tableId = Destinations.tableOf(destination);
        presence.join(accessor.getSessionId(), accessor.getSubscriptionId(), tableId, UUID.fromString(user.getName()));
        sessions.broadcastPresence(tableId);
    }

    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (accessor.getSessionId() == null || accessor.getSubscriptionId() == null) {
            return;
        }
        UUID tableId = presence.leave(accessor.getSessionId(), accessor.getSubscriptionId());
        if (tableId != null) {
            sessions.broadcastPresence(tableId);
        }
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        Set<UUID> affected = presence.leaveSession(event.getSessionId());
        affected.forEach(sessions::broadcastPresence);
    }
}
