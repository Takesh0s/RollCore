package com.rollcore.service;

import com.rollcore.dto.response.UserProfileResponse;
import com.rollcore.entity.User;
import com.rollcore.entity.User.Plan;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.GameTableRepository;
import com.rollcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Read-only account summary: plan and table quota (Fase 2c). */
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
        User user = users.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));
        int used = (int) tables.countBySponsorId(userId);
        Integer limit = user.getPlan() == Plan.PREMIUM ? null : freeMaxTables;
        return new UserProfileResponse(
                user.getId(), user.getUsername(), user.getEmail(), user.getPlan().name(), used, limit);
    }
}
