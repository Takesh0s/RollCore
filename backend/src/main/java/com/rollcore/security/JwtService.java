package com.rollcore.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Generates and validates JWT access and refresh tokens.
 *
 * <ul>
 *   <li>Access token  : 15 min — sent as Bearer on every API call.
 *   <li>Refresh token : 7 days  — exchanged for a new access token (UC-01 S01).
 * </ul>
 *
 * <p>Both token types carry a {@code "type"} claim to prevent one type from being
 * accepted where the other is expected.
 *
 * <p>Arquitetura §3 (Segurança) / UC-01 RN-02.
 */
@Slf4j
@Service
public class JwtService {

    private static final String CLAIM_TYPE    = "type";
    private static final String TYPE_ACCESS   = "access";
    private static final String TYPE_REFRESH  = "refresh";

    private final SecretKey key;
    private final long      accessMs;
    private final long      refreshMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration-ms}") long accessMs,
            @Value("${jwt.refresh-token-expiration-ms}") long refreshMs) {
        this.key       = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessMs  = accessMs;
        this.refreshMs = refreshMs;
    }

    // ── Generation ────────────────────────────────────────────────────────────

    public String generateAccessToken(UUID userId) {
        return build(userId.toString(), TYPE_ACCESS, accessMs);
    }

    public String generateRefreshToken(UUID userId) {
        return build(userId.toString(), TYPE_REFRESH, refreshMs);
    }

    private String build(String subject, String type, long expirationMs) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(subject)
                .claim(CLAIM_TYPE, type)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(key)
                .compact();
    }

    // ── Validation ────────────────────────────────────────────────────────────

    public UUID extractUserId(String token) {
        return UUID.fromString(claims(token).getSubject());
    }

    public boolean isValidAccessToken(String token) {
        try {
            return TYPE_ACCESS.equals(claims(token).get(CLAIM_TYPE, String.class));
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid access token: {}", e.getMessage());
            return false;
        }
    }

    public boolean isValidRefreshToken(String token) {
        try {
            return TYPE_REFRESH.equals(claims(token).get(CLAIM_TYPE, String.class));
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid refresh token: {}", e.getMessage());
            return false;
        }
    }

    private Claims claims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
