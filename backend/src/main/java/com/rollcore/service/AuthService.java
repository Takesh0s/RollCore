package com.rollcore.service;

import com.rollcore.dto.request.GoogleLoginRequest;
import com.rollcore.dto.request.LoginRequest;
import com.rollcore.dto.request.RefreshRequest;
import com.rollcore.dto.request.RegisterRequest;
import com.rollcore.dto.response.AuthResponse;
import com.rollcore.dto.response.DeleteResponse;
import com.rollcore.entity.User;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.UserRepository;
import com.rollcore.security.GoogleIdentity;
import com.rollcore.security.GoogleTokenVerifier;
import com.rollcore.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handles user registration, login, token refresh and logout — UC-01.
 *
 * <ul>
 *   <li>Passwords hashed with BCrypt factor 12 — UC-01 RN-01 / RNF-03.
 *   <li>Issues access (15 min) + refresh (7 days) JWT pair — UC-01 RN-02.
 *   <li>Refresh tokens are stored hashed, rotated on every use and revocable
 *       ({@link RefreshTokenService}).
 *   <li>Login error is generic — UC-01 RN-03 / MSG003 (OWASP: no user enumeration).
 *   <li>Email and username uniqueness checked before insert — UC-01 A01 / 409.
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository       userRepository;
    private final PasswordEncoder      passwordEncoder;
    private final JwtService           jwtService;
    private final RefreshTokenService  refreshTokenService;
    private final GoogleTokenVerifier  googleTokenVerifier;

    /**
     * Creates a new user account and returns a token pair.
     *
     * @throws ConflictException if the email or username is already taken (HTTP 409).
     */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email    = req.email().toLowerCase();
        String username = req.username();

        if (userRepository.existsByEmail(email)) {
            // UC-01 A01 / MSG001
            throw new ConflictException("Email is already registered. Please use a different email or log in.");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username is already in use. Please choose a different one.");
        }

        User user = User.builder()
                .email(email)
                .username(username)
                .passwordHash(passwordEncoder.encode(req.password()))
                .build();

        userRepository.save(user);
        return newSession(user);
    }

    /**
     * Authenticates by email + password and returns a token pair (new session family).
     *
     * @throws BadCredentialsException if credentials are wrong — UC-01 E01 / MSG003.
     */
    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials."));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials.");
        }

        return newSession(user);
    }

    /**
     * Signs in with a Google ID token, creating the account on first use.
     *
     * <ol>
     *   <li>Known Google subject: log that user in.
     *   <li>Unknown subject but the (Google-verified) e-mail belongs to a password
     *       account: link the Google id to it.
     *   <li>Otherwise: create a new account with a generated username and an
     *       unusable random password.
     * </ol>
     *
     * @throws BadCredentialsException if the token is invalid, or the e-mail is already
     *         linked to a different Google account.
     */
    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest req) {
        GoogleIdentity identity = googleTokenVerifier.verify(req.idToken());

        User user = userRepository.findByGoogleSub(identity.subject())
                .orElseGet(() -> linkOrCreate(identity));

        return newSession(user);
    }

    private User linkOrCreate(GoogleIdentity identity) {
        return userRepository.findByEmail(identity.email())
                .map(existing -> {
                    if (existing.getGoogleSub() != null) {
                        throw new BadCredentialsException("Invalid credentials.");
                    }
                    existing.setGoogleSub(identity.subject());
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(identity.email())
                        .username(generateUsername(identity.email()))
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .googleSub(identity.subject())
                        .build()));
    }

    /** Derives a valid, unused username (3-20 chars, [a-zA-Z0-9_]) from the e-mail local part. */
    private String generateUsername(String email) {
        String base = email.substring(0, email.indexOf('@')).replaceAll("[^a-zA-Z0-9_]", "_");
        if (base.length() < 3) {
            base = (base + "user").substring(0, 4);
        }
        if (base.length() > 20) {
            base = base.substring(0, 20);
        }
        if (!userRepository.existsByUsername(base)) {
            return base;
        }
        String stem = base.length() > 15 ? base.substring(0, 15) : base;
        for (int i = 0; i < 10; i++) {
            String candidate = stem + "_" + (1000 + java.util.concurrent.ThreadLocalRandom.current().nextInt(9000));
            if (!userRepository.existsByUsername(candidate)) {
                return candidate;
            }
        }
        return "u" + UUID.randomUUID().toString().replace("-", "").substring(0, 15);
    }

    /**
     * Exchanges a valid refresh token for a new access + refresh pair (rotation).
     * Re-using an already-rotated token revokes the whole session family.
     *
     * <p>{@code noRollbackFor}: the family revocation must be committed even though
     * we answer 401.
     *
     * @throws BadCredentialsException if the token is invalid, expired, revoked or reused.
     */
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public AuthResponse refresh(RefreshRequest req) {
        RefreshTokenService.Rotated rotated = refreshTokenService.rotate(req.refreshToken());

        User user = userRepository.findById(rotated.userId())
                .orElseThrow(() -> new BadCredentialsException("User not found."));

        return response(user, rotated.refreshToken());
    }

    /** Revokes the session the given refresh token belongs to. Idempotent, never reveals validity. */
    @Transactional
    public void logout(RefreshRequest req) {
        refreshTokenService.revokeSessionOf(req.refreshToken());
    }

    /** Revokes every refresh token of the user (all devices). */
    @Transactional
    public void logoutAll(UUID userId) {
        refreshTokenService.revokeAllFor(userId);
    }

    /** Deletes the caller's own account; child rows go via ON DELETE CASCADE. */
    @Transactional
    public DeleteResponse deleteAccount(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException("User not found.");
        }
        userRepository.deleteById(userId);
        return new DeleteResponse("User with ID: " + userId + " has been deleted.");
    }

    /** E2E-only: wipes all users. Reachable solely via E2eSupportController (opt-in flag). */
    @Transactional
    public DeleteResponse deleteAllForE2e() {
        userRepository.deleteAll();
        return new DeleteResponse("All Users have been deleted.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthResponse newSession(User user) {
        return response(user, refreshTokenService.startSession(user.getId()));
    }

    private AuthResponse response(User user, String refreshToken) {
        return new AuthResponse(
                jwtService.generateAccessToken(user.getId()),
                refreshToken,
                user.getId(),
                user.getEmail(),
                user.getUsername());
    }
}
