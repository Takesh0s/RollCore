package com.rollcore.service;

import com.rollcore.entity.RefreshToken;
import com.rollcore.repository.RefreshTokenRepository;
import com.rollcore.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Server-side lifecycle of refresh tokens (Fase 1).
 *
 * <ul>
 *   <li>Only the SHA-256 hash of each token is persisted.
 *   <li><b>Rotation</b>: every refresh revokes the presented token and issues a new
 *       one in the same family.
 *   <li><b>Reuse detection</b>: presenting an already-rotated token revokes the whole
 *       family (the token was probably stolen). A short grace window
 *       ({@value #GRACE_SECONDS}s) tolerates two tabs/devices racing with the same
 *       token: that request is rejected, but the family stays alive.
 *   <li>Access tokens already issued stay valid until they expire (max 15 min).
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    static final long GRACE_SECONDS = 10;
    private static final String INVALID = "Refresh token is invalid or expired.";

    private final RefreshTokenRepository repository;
    private final JwtService             jwtService;

    /** Result of a successful rotation. */
    public record Rotated(UUID userId, String refreshToken) {}

    /** Starts a brand-new session family (login / register). Returns the raw refresh token. */
    @Transactional
    public String startSession(UUID userId) {
        return issue(userId, UUID.randomUUID()).token();
    }

    /**
     * Validates and rotates a refresh token.
     *
     * @throws BadCredentialsException if invalid, expired, revoked or reused.
     */
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public Rotated rotate(String token) {
        if (token == null || !jwtService.isValidRefreshToken(token)) {
            throw new BadCredentialsException(INVALID);
        }

        RefreshToken current = repository.findByTokenHashForUpdate(hash(token))
                .orElseThrow(() -> new BadCredentialsException(INVALID));

        Instant now = Instant.now();

        if (current.getRevokedAt() != null) {
            boolean withinGrace = current.getReplacedBy() != null
                    && Duration.between(current.getRevokedAt(), now).getSeconds() <= GRACE_SECONDS;
            if (!withinGrace) {
                int n = repository.revokeFamily(current.getFamilyId(), now);
                log.warn("Refresh token reuse detected for user {} — revoked {} token(s) of family {}",
                        current.getUserId(), n, current.getFamilyId());
            }
            throw new BadCredentialsException(INVALID);
        }

        if (!current.getExpiresAt().isAfter(now)) {
            throw new BadCredentialsException(INVALID);
        }

        Issued next = issue(current.getUserId(), current.getFamilyId());
        current.setRevokedAt(now);
        current.setReplacedBy(next.entity().getId());
        repository.save(current);

        return new Rotated(current.getUserId(), next.token());
    }

    /** Revokes the family of the given token. Silent for unknown/invalid tokens. */
    @Transactional
    public void revokeSessionOf(String token) {
        if (token == null || !jwtService.isValidRefreshToken(token)) return;
        repository.findByTokenHash(hash(token))
                .ifPresent(t -> repository.revokeFamily(t.getFamilyId(), Instant.now()));
    }

    /** Revokes every active refresh token of the user. */
    @Transactional
    public void revokeAllFor(UUID userId) {
        repository.revokeAllForUser(userId, Instant.now());
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private record Issued(RefreshToken entity, String token) {}

    private Issued issue(UUID userId, UUID familyId) {
        String token = jwtService.generateRefreshToken(userId);
        RefreshToken saved = repository.save(RefreshToken.builder()
                .userId(userId)
                .familyId(familyId)
                .tokenHash(hash(token))
                .expiresAt(jwtService.extractExpiration(token))
                .build());
        return new Issued(saved, token);
    }

    static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
