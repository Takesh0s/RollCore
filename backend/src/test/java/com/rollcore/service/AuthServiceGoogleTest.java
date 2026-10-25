package com.rollcore.service;

import com.rollcore.dto.request.GoogleLoginRequest;
import com.rollcore.dto.response.AuthResponse;
import com.rollcore.entity.User;
import com.rollcore.repository.UserRepository;
import com.rollcore.security.GoogleIdentity;
import com.rollcore.security.GoogleTokenVerifier;
import com.rollcore.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — Google sign-in")
class AuthServiceGoogleTest {

    @Mock UserRepository       users;
    @Mock PasswordEncoder      encoder;
    @Mock JwtService           jwt;
    @Mock RefreshTokenService  refresh;
    @Mock GoogleTokenVerifier  google;

    private AuthService service;

    private final GoogleLoginRequest req = new GoogleLoginRequest("id-token");
    private final GoogleIdentity identity = new GoogleIdentity("sub-1", "player.one@gmail.com", "Player One");

    @BeforeEach
    void setUp() {
        service = new AuthService(users, encoder, jwt, refresh, google);
    }

    private void stubSession(UUID id) {
        when(refresh.startSession(id)).thenReturn("refresh-token");
        when(jwt.generateAccessToken(id)).thenReturn("access-token");
    }

    @Test @DisplayName("known Google id logs the existing user in")
    void existingGoogleUser() {
        UUID id = UUID.randomUUID();
        User user = User.builder().id(id).email("player.one@gmail.com").username("playerone")
                .passwordHash("h").googleSub("sub-1").build();
        when(google.verify("id-token")).thenReturn(identity);
        when(users.findByGoogleSub("sub-1")).thenReturn(Optional.of(user));
        stubSession(id);

        AuthResponse r = service.loginWithGoogle(req);

        assertThat(r.accessToken()).isEqualTo("access-token");
        assertThat(r.refreshToken()).isEqualTo("refresh-token");
        assertThat(r.username()).isEqualTo("playerone");
        verify(users, never()).save(any());
    }

    @Test @DisplayName("password account with the same e-mail gets the Google id linked")
    void linksExistingAccount() {
        UUID id = UUID.randomUUID();
        User user = User.builder().id(id).email("player.one@gmail.com").username("playerone")
                .passwordHash("h").build();
        when(google.verify("id-token")).thenReturn(identity);
        when(users.findByGoogleSub("sub-1")).thenReturn(Optional.empty());
        when(users.findByEmail("player.one@gmail.com")).thenReturn(Optional.of(user));
        when(users.save(user)).thenReturn(user);
        stubSession(id);

        service.loginWithGoogle(req);

        assertThat(user.getGoogleSub()).isEqualTo("sub-1");
        verify(users).save(user);
    }

    @Test @DisplayName("e-mail already linked to another Google account is refused")
    void emailLinkedElsewhere() {
        User user = User.builder().id(UUID.randomUUID()).email("player.one@gmail.com").username("playerone")
                .passwordHash("h").googleSub("other-sub").build();
        when(google.verify("id-token")).thenReturn(identity);
        when(users.findByGoogleSub("sub-1")).thenReturn(Optional.empty());
        when(users.findByEmail("player.one@gmail.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.loginWithGoogle(req)).isInstanceOf(BadCredentialsException.class);
        verify(users, never()).save(any());
    }

    @Test @DisplayName("unknown user is created with a sanitised username and an unusable password")
    void createsAccount() {
        UUID id = UUID.randomUUID();
        when(google.verify("id-token")).thenReturn(identity);
        when(users.findByGoogleSub("sub-1")).thenReturn(Optional.empty());
        when(users.findByEmail("player.one@gmail.com")).thenReturn(Optional.empty());
        when(users.existsByUsername("player_one")).thenReturn(false);
        when(encoder.encode(anyString())).thenReturn("hashed-random");
        when(users.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(id);
            return u;
        });
        stubSession(id);

        AuthResponse r = service.loginWithGoogle(req);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertThat(saved.getValue().getUsername()).isEqualTo("player_one");
        assertThat(saved.getValue().getGoogleSub()).isEqualTo("sub-1");
        assertThat(saved.getValue().getPasswordHash()).isEqualTo("hashed-random");
        assertThat(r.username()).isEqualTo("player_one");
    }

    @Test @DisplayName("taken username gets a numeric suffix within 20 characters")
    void usernameCollision() {
        UUID id = UUID.randomUUID();
        GoogleIdentity longName = new GoogleIdentity("sub-2", "a.very.long.local.part.name@gmail.com", "X");
        when(google.verify("id-token")).thenReturn(longName);
        when(users.findByGoogleSub("sub-2")).thenReturn(Optional.empty());
        when(users.findByEmail("a.very.long.local.part.name@gmail.com")).thenReturn(Optional.empty());
        when(users.existsByUsername("a_very_long_local_pa")).thenReturn(true);
        when(users.existsByUsername(org.mockito.ArgumentMatchers.argThat(
                (String s) -> s != null && s.startsWith("a_very_long_loc_")))).thenReturn(false);
        when(encoder.encode(anyString())).thenReturn("hashed-random");
        when(users.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(id);
            return u;
        });
        stubSession(id);

        service.loginWithGoogle(req);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertThat(saved.getValue().getUsername()).hasSizeLessThanOrEqualTo(20)
                .matches("^[a-zA-Z0-9_]{3,20}$").startsWith("a_very_long_loc_");
    }

    @Test @DisplayName("very short local part is padded to a valid username")
    void shortLocalPart() {
        UUID id = UUID.randomUUID();
        GoogleIdentity shortId = new GoogleIdentity("sub-3", "ab@gmail.com", "X");
        when(google.verify("id-token")).thenReturn(shortId);
        when(users.findByGoogleSub("sub-3")).thenReturn(Optional.empty());
        when(users.findByEmail("ab@gmail.com")).thenReturn(Optional.empty());
        when(users.existsByUsername("abus")).thenReturn(false);
        when(encoder.encode(anyString())).thenReturn("hashed-random");
        when(users.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(id);
            return u;
        });
        stubSession(id);

        AuthResponse r = service.loginWithGoogle(req);

        assertThat(r.username()).matches("^[a-zA-Z0-9_]{3,20}$");
    }

    @Test @DisplayName("invalid Google token is propagated and nothing is persisted")
    void invalidToken() {
        when(google.verify("id-token")).thenThrow(new BadCredentialsException("Invalid Google token."));

        assertThatThrownBy(() -> service.loginWithGoogle(req)).isInstanceOf(BadCredentialsException.class);
        verify(users, never()).save(any());
    }
}
