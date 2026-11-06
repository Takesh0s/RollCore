package com.rollcore.service;

import com.rollcore.dto.request.UpdateProfileRequest;
import com.rollcore.dto.response.UserProfileResponse;
import com.rollcore.exception.ConflictException;
import com.rollcore.entity.User;
import com.rollcore.entity.User.Plan;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.GameTableRepository;
import com.rollcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Account summary (plan, table quota) and profile edits (display name, photo). */
@Service
public class AccountService {

    private final UserRepository      users;
    private final GameTableRepository tables;
    private final int                 freeMaxTables;

    public AccountService(UserRepository users,
                          GameTableRepository tables,
                          @Value("${rollcore.tables.free-max-tables:1}") int freeMaxTables) {
        this.users         = users;
        this.tables        = tables;
        this.freeMaxTables = freeMaxTables;
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
