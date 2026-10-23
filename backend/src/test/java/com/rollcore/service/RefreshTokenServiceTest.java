package com.rollcore.service;

import com.rollcore.entity.RefreshToken;
import com.rollcore.repository.RefreshTokenRepository;
import com.rollcore.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RefreshTokenService — rotation, reuse detection, revocation")
class RefreshTokenServiceTest {

    private static final String SECRET = "a-strong-test-secret-with-more-than-32-bytes!!";

    @Mock RefreshTokenRepository repository;

    private JwtService jwt;
    private RefreshTokenService service;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        jwt     = new JwtService(SECRET, 900_000L, 604_800_000L);
        service = new RefreshTokenService(repository, jwt);
    }

    /** save() echoes the entity and assigns an id when missing, like JPA would. */
    private void stubSave() {
        when(repository.save(any(RefreshToken.class))).thenAnswer(inv -> {
            RefreshToken t = inv.getArgument(0);
            if (t.getId() == null) t.setId(UUID.randomUUID());
            return t;
        });
    }

    private RefreshToken stored(String token, UUID familyId, Instant revokedAt, UUID replacedBy) {
        return RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .familyId(familyId)
                .tokenHash(RefreshTokenService.hash(token))
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revokedAt(revokedAt)
                .replacedBy(replacedBy)
                .build();
    }

    @Test
    @DisplayName("startSession() persists only the hash, never the raw token")
    void startSessionStoresHash() {
        stubSave();

        String token = service.startSession(userId);

        ArgumentCaptor<RefreshToken> cap = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository).save(cap.capture());
        RefreshToken saved = cap.getValue();
        assertThat(saved.getTokenHash()).hasSize(64).isNotEqualTo(token)
                .isEqualTo(RefreshTokenService.hash(token));
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getFamilyId()).isNotNull();
        assertThat(saved.getExpiresAt()).isAfter(Instant.now());
    }

    @Test
    @DisplayName("rotate() revokes the old token and issues a new one in the same family")
    void rotateIssuesNewTokenInSameFamily() {
        stubSave();
        UUID family = UUID.randomUUID();
        String token = jwt.generateRefreshToken(userId);
        RefreshToken current = stored(token, family, null, null);
        when(repository.findByTokenHashForUpdate(current.getTokenHash())).thenReturn(Optional.of(current));

        RefreshTokenService.Rotated r = service.rotate(token);

        assertThat(r.userId()).isEqualTo(userId);
        assertThat(r.refreshToken()).isNotEqualTo(token);
        assertThat(jwt.isValidRefreshToken(r.refreshToken())).isTrue();
        assertThat(current.getRevokedAt()).isNotNull();
        assertThat(current.getReplacedBy()).isNotNull();

        ArgumentCaptor<RefreshToken> cap = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository, atLeastOnce()).save(cap.capture());
        assertThat(cap.getAllValues()).anyMatch(t -> family.equals(t.getFamilyId())
                && t.getTokenHash().equals(RefreshTokenService.hash(r.refreshToken())));
    }

    @Test
    @DisplayName("rotate() rejects a token that is not in the database")
    void rotateRejectsUnknownToken() {
        String token = jwt.generateRefreshToken(userId);
        when(repository.findByTokenHashForUpdate(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.rotate(token)).isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("rotate() rejects garbage and access tokens without touching the database")
    void rotateRejectsInvalidJwt() {
        assertThatThrownBy(() -> service.rotate("not-a-jwt")).isInstanceOf(BadCredentialsException.class);
        assertThatThrownBy(() -> service.rotate(jwt.generateAccessToken(userId)))
                .isInstanceOf(BadCredentialsException.class);
        assertThatThrownBy(() -> service.rotate(null)).isInstanceOf(BadCredentialsException.class);
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("reuse of a rotated token after the grace window revokes the whole family")
    void reuseRevokesFamily() {
        UUID family = UUID.randomUUID();
        String token = jwt.generateRefreshToken(userId);
        RefreshToken old = stored(token, family,
                Instant.now().minusSeconds(RefreshTokenService.GRACE_SECONDS + 60), UUID.randomUUID());
        when(repository.findByTokenHashForUpdate(old.getTokenHash())).thenReturn(Optional.of(old));

        assertThatThrownBy(() -> service.rotate(token)).isInstanceOf(BadCredentialsException.class);

        verify(repository).revokeFamily(eq(family), any(Instant.class));
    }

    @Test
    @DisplayName("a racing duplicate within the grace window is rejected but does not kill the family")
    void raceWithinGraceDoesNotRevokeFamily() {
        UUID family = UUID.randomUUID();
        String token = jwt.generateRefreshToken(userId);
        RefreshToken old = stored(token, family, Instant.now().minusSeconds(2), UUID.randomUUID());
        when(repository.findByTokenHashForUpdate(old.getTokenHash())).thenReturn(Optional.of(old));

        assertThatThrownBy(() -> service.rotate(token)).isInstanceOf(BadCredentialsException.class);

        verify(repository, never()).revokeFamily(any(), any());
    }

    @Test
    @DisplayName("a token revoked by logout (no replacement) revokes the family if reused")
    void loggedOutTokenReuseRevokesFamily() {
        UUID family = UUID.randomUUID();
        String token = jwt.generateRefreshToken(userId);
        RefreshToken revoked = stored(token, family, Instant.now().minusSeconds(1), null);
        when(repository.findByTokenHashForUpdate(revoked.getTokenHash())).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> service.rotate(token)).isInstanceOf(BadCredentialsException.class);

        verify(repository).revokeFamily(eq(family), any(Instant.class));
    }

    @Test
    @DisplayName("revokeSessionOf() revokes the family of a known token")
    void logoutRevokesFamily() {
        UUID family = UUID.randomUUID();
        String token = jwt.generateRefreshToken(userId);
        RefreshToken current = stored(token, family, null, null);
        when(repository.findByTokenHash(current.getTokenHash())).thenReturn(Optional.of(current));

        service.revokeSessionOf(token);

        verify(repository).revokeFamily(eq(family), any(Instant.class));
    }

    @Test
    @DisplayName("revokeSessionOf() is silent for invalid tokens")
    void logoutIgnoresInvalidToken() {
        service.revokeSessionOf("garbage");
        service.revokeSessionOf(null);

        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("revokeAllFor() revokes every active token of the user")
    void logoutAllRevokesUserTokens() {
        service.revokeAllFor(userId);

        verify(repository).revokeAllForUser(eq(userId), any(Instant.class));
    }
}
