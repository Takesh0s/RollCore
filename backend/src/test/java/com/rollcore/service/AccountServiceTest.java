package com.rollcore.service;

import com.rollcore.dto.response.UserProfileResponse;
import com.rollcore.entity.User;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.GameTableRepository;
import com.rollcore.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccountService — plano e cota de mesas")
class AccountServiceTest {

    @Mock UserRepository      users;
    @Mock GameTableRepository tables;

    private AccountService service;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new AccountService(users, tables, 1);
    }

    private User user(User.Plan plan) {
        return User.builder().id(userId).username("luiz").email("l@x.com").passwordHash("h").plan(plan).build();
    }

    @Test @DisplayName("FREE user sees the free quota and what is used")
    void freeProfile() {
        when(users.findById(userId)).thenReturn(Optional.of(user(User.Plan.FREE)));
        when(tables.countBySponsorId(userId)).thenReturn(1L);

        UserProfileResponse r = service.me(userId);

        assertThat(r.plan()).isEqualTo("FREE");
        assertThat(r.tablesUsed()).isEqualTo(1);
        assertThat(r.tablesLimit()).isEqualTo(1);
    }

    @Test @DisplayName("PREMIUM user has no visible table limit")
    void premiumProfile() {
        when(users.findById(userId)).thenReturn(Optional.of(user(User.Plan.PREMIUM)));
        when(tables.countBySponsorId(userId)).thenReturn(7L);

        UserProfileResponse r = service.me(userId);

        assertThat(r.plan()).isEqualTo("PREMIUM");
        assertThat(r.tablesUsed()).isEqualTo(7);
        assertThat(r.tablesLimit()).isNull();
    }

    @Test @DisplayName("unknown user → 404")
    void unknownUser() {
        when(users.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.me(userId)).isInstanceOf(NotFoundException.class);
    }
}
