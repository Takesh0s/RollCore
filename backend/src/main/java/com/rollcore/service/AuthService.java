package com.rollcore.service;

import com.rollcore.dto.request.LoginRequest;
import com.rollcore.dto.request.RefreshRequest;
import com.rollcore.dto.request.RegisterRequest;
import com.rollcore.dto.response.AuthResponse;
import com.rollcore.entity.User;
import com.rollcore.exception.ConflictException;
import com.rollcore.repository.UserRepository;
import com.rollcore.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Handles user registration, login and token refresh — UC-01.
 *
 * <ul>
 *   <li>Passwords hashed with BCrypt factor 12 — UC-01 RN-01 / RNF-03.
 *   <li>Issues access (15 min) + refresh (7 days) JWT pair — UC-01 RN-02.
 *   <li>Login error is generic — UC-01 RN-03 / MSG003 (OWASP: no user enumeration).
 *   <li>Email and username uniqueness checked before insert — UC-01 A01 / 409.
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService      jwtService;

    /**
     * Creates a new user account and returns a token pair.
     * UC-01 §3.1 (cadastro) — pré-condição: email/username únicos.
     *
     * @throws ConflictException if the email or username is already taken (HTTP 409).
     */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email    = req.email().toLowerCase();
        String username = req.username();

        if (userRepository.existsByEmail(email)) {
            // UC-01 A01 / MSG001
            throw new ConflictException("E-mail já cadastrado. Utilize outro e-mail ou faça login.");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username já em uso. Escolha outro.");
        }

        User user = User.builder()
                .email(email)
                .username(username)
                .passwordHash(passwordEncoder.encode(req.password()))
                .build();

        userRepository.save(user);
        return tokenPair(user);
    }

    /**
     * Authenticates by email + password and returns a token pair.
     * UC-01 §3.1 (login).
     *
     * @throws BadCredentialsException if credentials are wrong — UC-01 E01 / MSG003.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas."));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Credenciais inválidas.");
        }

        return tokenPair(user);
    }

    /**
     * Exchanges a valid refresh token for a new access + refresh pair.
     * UC-01 S01 (renovação de token).
     *
     * @throws BadCredentialsException if the token is invalid or expired — UC-01 E03.
     */
    @Transactional(readOnly = true)
    public AuthResponse refresh(RefreshRequest req) {
        String token = req.refreshToken();

        if (!jwtService.isValidRefreshToken(token)) {
            throw new BadCredentialsException("Refresh token inválido ou expirado.");
        }

        UUID userId = jwtService.extractUserId(token);
        User user   = userRepository.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("Usuário não encontrado."));

        return tokenPair(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthResponse tokenPair(User user) {
        return new AuthResponse(
                jwtService.generateAccessToken(user.getId()),
                jwtService.generateRefreshToken(user.getId()),
                user.getId(),
                user.getEmail(),
                user.getUsername());
    }
}