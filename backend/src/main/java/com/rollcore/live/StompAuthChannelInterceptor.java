package com.rollcore.live;

import com.rollcore.repository.GameTableMemberRepository;
import com.rollcore.repository.UserRepository;
import com.rollcore.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

/**
 * Authentication and authorization of STOMP traffic.
 *
 * <ul>
 *   <li><b>CONNECT</b> must carry {@code Authorization: Bearer <access token>}. The handshake itself
 *       is public because browsers cannot set headers on a WebSocket upgrade.
 *   <li><b>SUBSCRIBE</b> is limited to {@code /topic/tables/{id}/rolls|presence} of tables the user
 *       belongs to, plus the user's own error queue. Any other destination is refused.
 *   <li><b>SEND</b> is limited to {@code /app/tables/{id}/roll}; membership is checked again in the
 *       service, so a user removed from a table cannot keep rolling on it.
 * </ul>
 *
 * Every refusal throws, which makes Spring send a STOMP ERROR frame and close the connection.
 */
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String BEARER = "Bearer ";

    // Plain repositories only: depending on TableSessionService (which needs the
    // messaging template) would create a cycle with the WebSocket configuration.
    private final JwtService                jwt;
    private final UserRepository            users;
    private final GameTableMemberRepository members;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        switch (command) {
            case CONNECT, STOMP  -> authenticate(accessor);
            case SUBSCRIBE        -> authorizeSubscribe(accessor);
            case SEND             -> authorizeSend(accessor);
            default               -> { /* UNSUBSCRIBE, DISCONNECT, heart-beats, ACK: nothing to check */ }
        }
        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader("Authorization");
        if (header == null || !header.startsWith(BEARER)) {
            throw denied("Missing bearer token.");
        }
        String token = header.substring(BEARER.length());

        UUID userId;
        try {
            if (!jwt.isValidAccessToken(token)) throw denied("Invalid token.");
            userId = jwt.extractUserId(token);
        } catch (MessagingException e) {
            throw e;
        } catch (RuntimeException e) {
            throw denied("Invalid token.");
        }
        if (!users.existsById(userId)) {
            throw denied("Unknown user.");
        }

        accessor.setUser(new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        UUID userId = requireUser(accessor);
        String destination = accessor.getDestination();

        if (Destinations.USER_ERRORS.equals(destination)) {
            return;
        }
        UUID tableId = Destinations.tableOf(destination);
        if (tableId == null) {
            throw denied("Destination not allowed.");
        }
        if (members.findByGameTableIdAndUserId(tableId, userId).isEmpty()) {
            throw denied("Not a member of this table.");
        }
    }

    private void authorizeSend(StompHeaderAccessor accessor) {
        requireUser(accessor);
        String destination = accessor.getDestination();
        if (destination == null || !destination.matches("^/app/tables/[0-9a-fA-F-]{36}/roll$")) {
            throw denied("Destination not allowed.");
        }
    }

    private static UUID requireUser(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user == null) {
            throw denied("Not authenticated.");
        }
        try {
            return UUID.fromString(user.getName());
        } catch (IllegalArgumentException e) {
            throw denied("Not authenticated.");
        }
    }

    private static MessagingException denied(String reason) {
        return new MessagingException(reason);
    }
}
