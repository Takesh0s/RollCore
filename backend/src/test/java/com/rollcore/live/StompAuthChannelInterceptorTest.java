package com.rollcore.live;

import com.rollcore.entity.GameTableMember;
import com.rollcore.repository.GameTableMemberRepository;
import com.rollcore.repository.UserRepository;
import com.rollcore.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("StompAuthChannelInterceptor")
class StompAuthChannelInterceptorTest {

    @Mock JwtService                jwt;
    @Mock UserRepository            users;
    @Mock GameTableMemberRepository members;

    private final MessageChannel channel = mock(MessageChannel.class);
    private StompAuthChannelInterceptor interceptor;

    private final UUID userId  = UUID.randomUUID();
    private final UUID tableId = UUID.randomUUID();
    private final Principal principal = new UsernamePasswordAuthenticationToken(userId.toString(), null);

    @BeforeEach
    void setUp() {
        interceptor = new StompAuthChannelInterceptor(jwt, users, members);
    }

    private static Message<byte[]> frame(StompCommand command, String destination, String authorization, Principal user) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        if (destination != null)   accessor.setDestination(destination);
        if (authorization != null) accessor.addNativeHeader("Authorization", authorization);
        if (user != null)          accessor.setUser(user);
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    // ── CONNECT ───────────────────────────────────────────────────────────────

    @Test @DisplayName("CONNECT with a valid access token authenticates the user")
    void connectOk() {
        when(jwt.isValidAccessToken("good")).thenReturn(true);
        when(jwt.extractUserId("good")).thenReturn(userId);
        when(users.existsById(userId)).thenReturn(true);

        Message<?> result = interceptor.preSend(frame(StompCommand.CONNECT, null, "Bearer good", null), channel);

        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertThat(accessor.getUser().getName()).isEqualTo(userId.toString());
    }

    @Test @DisplayName("CONNECT without a token is refused")
    void connectWithoutToken() {
        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.CONNECT, null, null, null), channel))
                .isInstanceOf(MessagingException.class);
    }

    @Test @DisplayName("CONNECT with an invalid or refresh token is refused")
    void connectInvalidToken() {
        when(jwt.isValidAccessToken("bad")).thenReturn(false);

        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.CONNECT, null, "Bearer bad", null), channel))
                .isInstanceOf(MessagingException.class);
    }

    @Test @DisplayName("CONNECT with a token of a deleted user is refused")
    void connectUnknownUser() {
        when(jwt.isValidAccessToken("good")).thenReturn(true);
        when(jwt.extractUserId("good")).thenReturn(userId);
        when(users.existsById(userId)).thenReturn(false);

        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.CONNECT, null, "Bearer good", null), channel))
                .isInstanceOf(MessagingException.class);
    }

    // ── SUBSCRIBE ─────────────────────────────────────────────────────────────

    @Test @DisplayName("a member may subscribe to the rolls and presence topics of their table")
    void subscribeMember() {
        when(members.findByGameTableIdAndUserId(tableId, userId))
                .thenReturn(Optional.of(GameTableMember.builder().build()));

        for (String topic : new String[] {Destinations.rolls(tableId), Destinations.presence(tableId)}) {
            Message<byte[]> msg = frame(StompCommand.SUBSCRIBE, topic, null, principal);
            assertThat(interceptor.preSend(msg, channel)).isSameAs(msg);
        }
    }

    @Test @DisplayName("a non-member cannot subscribe to a table topic")
    void subscribeNonMember() {
        when(members.findByGameTableIdAndUserId(tableId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> interceptor.preSend(
                frame(StompCommand.SUBSCRIBE, Destinations.rolls(tableId), null, principal), channel))
                .isInstanceOf(MessagingException.class);
    }

    @Test @DisplayName("the user's own error queue is allowed")
    void subscribeErrors() {
        Message<byte[]> msg = frame(StompCommand.SUBSCRIBE, "/user/queue/errors", null, principal);
        assertThat(interceptor.preSend(msg, channel)).isSameAs(msg);
    }

    @Test @DisplayName("unknown or wildcard destinations are refused")
    void subscribeOtherDestinations() {
        for (String destination : new String[] {"/topic/tables/" + tableId, "/topic/tables/*/rolls", "/topic/other", "/queue/x"}) {
            assertThatThrownBy(() -> interceptor.preSend(
                    frame(StompCommand.SUBSCRIBE, destination, null, principal), channel))
                    .isInstanceOf(MessagingException.class);
        }
    }

    @Test @DisplayName("an unauthenticated connection cannot subscribe")
    void subscribeAnonymous() {
        assertThatThrownBy(() -> interceptor.preSend(
                frame(StompCommand.SUBSCRIBE, Destinations.rolls(tableId), null, null), channel))
                .isInstanceOf(MessagingException.class);
    }

    // ── SEND ──────────────────────────────────────────────────────────────────

    @Test @DisplayName("SEND is only allowed to the roll destination of a table")
    void send() {
        Message<byte[]> ok = frame(StompCommand.SEND, "/app/tables/" + tableId + "/roll", null, principal);
        assertThat(interceptor.preSend(ok, channel)).isSameAs(ok);

        assertThatThrownBy(() -> interceptor.preSend(
                frame(StompCommand.SEND, "/topic/tables/" + tableId + "/rolls", null, principal), channel))
                .isInstanceOf(MessagingException.class);
        assertThatThrownBy(() -> interceptor.preSend(
                frame(StompCommand.SEND, "/app/tables/" + tableId + "/roll", null, null), channel))
                .isInstanceOf(MessagingException.class);
    }
}
