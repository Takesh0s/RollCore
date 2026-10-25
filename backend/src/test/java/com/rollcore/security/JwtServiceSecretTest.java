package com.rollcore.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JwtService — secret validation and token uniqueness")
class JwtServiceSecretTest {

    private static final String STRONG = "a-strong-test-secret-with-more-than-32-bytes!!";

    @Test
    @DisplayName("refuses to start with a secret shorter than 32 bytes")
    void rejectsShortSecret() {
        assertThatThrownBy(() -> new JwtService("short", 900_000L, 604_800_000L))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("refuses to start with the old placeholder default")
    void rejectsPlaceholderSecret() {
        assertThatThrownBy(() -> new JwtService(
                "CHANGE_THIS_TO_A_SECURE_256BIT_SECRET_KEY_IN_PRODUCTION!!", 900_000L, 604_800_000L))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("accepts a strong secret and keeps access/refresh types separate")
    void acceptsStrongSecret() {
        JwtService svc = new JwtService(STRONG, 900_000L, 604_800_000L);
        UUID id = UUID.randomUUID();
        String access  = svc.generateAccessToken(id);
        String refresh = svc.generateRefreshToken(id);

        assertThat(svc.isValidAccessToken(access)).isTrue();
        assertThat(svc.isValidAccessToken(refresh)).isFalse();
        assertThat(svc.isValidRefreshToken(refresh)).isTrue();
        assertThat(svc.isValidRefreshToken(access)).isFalse();
    }

    @Test
    @DisplayName("two refresh tokens issued in the same second are different (jti)")
    void refreshTokensAreUnique() {
        JwtService svc = new JwtService(STRONG, 900_000L, 604_800_000L);
        UUID id = UUID.randomUUID();

        assertThat(svc.generateRefreshToken(id)).isNotEqualTo(svc.generateRefreshToken(id));
    }
}
