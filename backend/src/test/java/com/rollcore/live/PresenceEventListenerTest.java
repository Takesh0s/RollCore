package com.rollcore.live;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import java.security.Principal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("PresenceEventListener")
class PresenceEventListenerTest {

    @Mock TableSessionService sessions;

    private final PresenceService presence = new PresenceService();
    private PresenceEventListener listener;

    private final UUID tableId = UUID.randomUUID();
    private final UUID userId  = UUID.randomUUID();
    private final Principal principal = new UsernamePasswordAuthenticationToken(userId.toString(), null);

    @BeforeEach
    void setUp() {
        listener = new PresenceEventListener(presence, sessions);
    }

    private Message<byte[]> frame(StompCommand command, String destination) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setSessionId("s1");
        accessor.setSubscriptionId("sub-0");
        if (destination != null) accessor.setDestination(destination);
        accessor.setUser(principal);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Test @DisplayName("subscribing to the presence topic marks the user online and broadcasts")
    void subscribePresence() {
        listener.onSubscribe(new SessionSubscribeEvent(this,
                frame(StompCommand.SUBSCRIBE, Destinations.presence(tableId)), principal));

        assertThat(presence.online(tableId)).containsExactly(userId);
        verify(sessions).broadcastPresence(tableId);
    }

    @Test @DisplayName("subscribing to the rolls topic does not count as presence")
    void subscribeRollsIgnored() {
        listener.onSubscribe(new SessionSubscribeEvent(this,
                frame(StompCommand.SUBSCRIBE, Destinations.rolls(tableId)), principal));

        assertThat(presence.online(tableId)).isEmpty();
        verify(sessions, never()).broadcastPresence(tableId);
    }

    @Test @DisplayName("unsubscribing marks the user offline and broadcasts")
    void unsubscribe() {
        presence.join("s1", "sub-0", tableId, userId);

        listener.onUnsubscribe(new SessionUnsubscribeEvent(this, frame(StompCommand.UNSUBSCRIBE, null), principal));

        assertThat(presence.online(tableId)).isEmpty();
        verify(sessions).broadcastPresence(tableId);
    }

    @Test @DisplayName("disconnecting removes the user from every table and broadcasts each one")
    void disconnect() {
        UUID other = UUID.randomUUID();
        presence.join("s1", "sub-0", tableId, userId);
        presence.join("s1", "sub-1", other, userId);

        listener.onDisconnect(new SessionDisconnectEvent(this, frame(StompCommand.DISCONNECT, null),
                "s1", CloseStatus.NORMAL, principal));

        assertThat(presence.online(tableId)).isEmpty();
        assertThat(presence.online(other)).isEmpty();
        verify(sessions, times(1)).broadcastPresence(tableId);
        verify(sessions, times(1)).broadcastPresence(other);
    }
}
