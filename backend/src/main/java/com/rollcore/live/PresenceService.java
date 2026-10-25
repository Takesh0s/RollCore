package com.rollcore.live;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Tracks which users are connected to which table.
 *
 * <p>State lives in memory, which is correct for a single API instance (the current
 * deployment). Running several instances would need a shared store (Redis) or a
 * broker relay; see docs/api/sessao-ao-vivo.md.
 *
 * <p>A user may have several connections (phone and browser): they stay online
 * until the last subscription is gone.
 */
@Service
public class PresenceService {

    /** One live subscription of a connection to a table's presence topic. */
    private record Sub(String sessionId, String subscriptionId) {}

    private record Entry(UUID tableId, UUID userId) {}

    private final Map<Sub, Entry> subscriptions = new HashMap<>();

    /** Registers a presence subscription. */
    public synchronized void join(String sessionId, String subscriptionId, UUID tableId, UUID userId) {
        subscriptions.put(new Sub(sessionId, subscriptionId), new Entry(tableId, userId));
    }

    /** Drops one subscription; returns the table it belonged to, or {@code null}. */
    public synchronized UUID leave(String sessionId, String subscriptionId) {
        Entry removed = subscriptions.remove(new Sub(sessionId, subscriptionId));
        return removed == null ? null : removed.tableId();
    }

    /** Drops every subscription of a connection; returns the tables that changed. */
    public synchronized Set<UUID> leaveSession(String sessionId) {
        Set<UUID> affected = new LinkedHashSet<>();
        subscriptions.entrySet().removeIf(e -> {
            boolean mine = e.getKey().sessionId().equals(sessionId);
            if (mine) affected.add(e.getValue().tableId());
            return mine;
        });
        return affected;
    }

    /** Distinct users connected to the table. */
    public synchronized Set<UUID> online(UUID tableId) {
        Set<UUID> users = new HashSet<>();
        for (Entry e : subscriptions.values()) {
            if (e.tableId().equals(tableId)) users.add(e.userId());
        }
        return users;
    }
}
