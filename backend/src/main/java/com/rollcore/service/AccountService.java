package com.rollcore.service;

import com.rollcore.dto.request.ChangeEmailRequest;
import com.rollcore.dto.request.ChangePasswordRequest;
import com.rollcore.dto.request.UpdateProfileRequest;
import com.rollcore.dto.response.AuthResponse;
import com.rollcore.dto.response.UserProfileResponse;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.entity.User;
import com.rollcore.entity.User.Plan;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.GameTableRepository;
import com.rollcore.repository.UserRepository;
import com.rollcore.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Account summary (plan, table quota) and account edits (name, photo, e-mail, password). */
@Service
public class AccountService {

    private final UserRepository      users;
    private final GameTableRepository tables;
    private final PasswordEncoder      passwordEncoder;
    private final RefreshTokenService  refreshTokens;
    private final JwtService           jwt;
    private final int                 freeMaxTables;

    public AccountService(UserRepository users,
                          GameTableRepository tables,
                          PasswordEncoder passwordEncoder,
                          RefreshTokenService refreshTokens,
                          JwtService jwt,
                          @Value("${rollcore.tables.free-max-tables:1}") int freeMaxTables) {
        this.users           = users;
        this.tables          = tables;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokens   = refreshTokens;
        this.jwt             = jwt;
        this.freeMaxTables   = freeMaxTables;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse me(UUID userId) {
        return toResponse(load(userId));
    }

    /** Updates username and/or avatar; the username stays unique across accounts. */
    @Transactional
    public UserProfileResponse updateMe(UUID userId, UpdateProfileRequest req) {
        User user = load(userId);

        if (req.username() != null && !req.username().equals(user.getUsername())) {
            if (users.existsByUsernameAndIdNot(req.username(), userId)) {
                throw new ConflictException("Username is already in use. Please choose a different one.");
            }
            user.setUsername(req.username());
        }
        if (req.avatarUrl() != null) {
            user.setAvatarUrl(req.avatarUrl().isBlank() ? null : req.avatarUrl());
        }
        return toResponse(users.save(user));
    }

    /**
     * Changes the sign-in e-mail after checking the current password. The address is stored
     * lowercase and stays unique across accounts.
     *
     * @throws ForbiddenException if the current password is wrong (403, not 401: a 401 would
     *         make the client think its session expired)
     * @throws ConflictException  if another account already uses the address
     */
    @Transactional
    public UserProfileResponse changeEmail(UUID userId, ChangeEmailRequest req) {
        User user = load(userId);
        requirePassword(user, req.currentPassword());

        String email = req.newEmail().trim().toLowerCase();
        if (!email.equals(user.getEmail())) {
            if (users.existsByEmail(email)) {
                throw new ConflictException("Email is already registered. Please use a different email.");
            }
            user.setEmail(email);
            users.save(user);
        }
        return toResponse(user);
    }

    /**
     * Changes the password after checking the current one, then signs the account out of every
     * device and starts a fresh session for the caller (returned so the client keeps working).
     *
     * @throws ForbiddenException if the current password is wrong
     */
    @Transactional
    public AuthResponse changePassword(UUID userId, ChangePasswordRequest req) {
        User user = load(userId);
        requirePassword(user, req.currentPassword());

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        users.save(user);

        refreshTokens.revokeAllFor(userId);
        return new AuthResponse(
                jwt.generateAccessToken(userId),
                refreshTokens.startSession(userId),
                userId, user.getEmail(), user.getUsername());
    }

    private void requirePassword(User user, String candidate) {
        if (!passwordEncoder.matches(candidate, user.getPasswordHash())) {
            throw new ForbiddenException("Current password is incorrect.");
        }
    }

    private User load(UUID userId) {
        return users.findById(userId).orElseThrow(() -> new NotFoundException("User not found."));
    }

    private UserProfileResponse toResponse(User user) {
        int used = (int) tables.countBySponsorId(user.getId());
        Integer limit = user.getPlan() == Plan.PREMIUM ? null : freeMaxTables;
        return new UserProfileResponse(
                user.getId(), user.getUsername(), user.getEmail(), user.getPlan().name(),
                used, limit, user.getAvatarUrl());
    }
}
