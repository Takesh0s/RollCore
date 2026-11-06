package com.rollcore.service;

import com.rollcore.dto.request.UpdateProfileRequest;
import com.rollcore.dto.response.UserProfileResponse;
import com.rollcore.exception.ConflictException;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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

    @Test @DisplayName("updateMe changes the username and avatar")
    void updateProfile() {
        User u = user(User.Plan.FREE);
        when(users.findById(userId)).thenReturn(Optional.of(u));
        when(users.existsByUsernameAndIdNot("novo_nome", userId)).thenReturn(false);
        when(users.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserProfileResponse r = service.updateMe(userId,
                new UpdateProfileRequest("novo_nome", "data:image/png;base64,AAAA"));

        assertThat(r.username()).isEqualTo("novo_nome");
        assertThat(r.avatarUrl()).isEqualTo("data:image/png;base64,AAAA");
    }

    @Test @DisplayName("updateMe rejects a username owned by another account")
    void usernameTaken() {
        when(users.findById(userId)).thenReturn(Optional.of(user(User.Plan.FREE)));
        when(users.existsByUsernameAndIdNot("ocupado", userId)).thenReturn(true);

        assertThatThrownBy(() -> service.updateMe(userId, new UpdateProfileRequest("ocupado", null)))
                .isInstanceOf(ConflictException.class);
        verify(users, never()).save(any());
    }

    @Test @DisplayName("updateMe leaves null fields alone and clears the avatar on blank")
    void partialAndClear() {
        User u = user(User.Plan.FREE);
        u.setAvatarUrl("https://x/y.png");
        when(users.findById(userId)).thenReturn(Optional.of(u));
        when(users.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserProfileResponse same = service.updateMe(userId, new UpdateProfileRequest(null, null));
        assertThat(same.username()).isEqualTo("luiz");
        assertThat(same.avatarUrl()).isEqualTo("https://x/y.png");

        UserProfileResponse cleared = service.updateMe(userId, new UpdateProfileRequest(null, ""));
        assertThat(cleared.avatarUrl()).isNull();
    }

    @Test @DisplayName("updateMe on a missing user → NotFoundException")
    void missing() {
        when(users.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateMe(userId, new UpdateProfileRequest("abc", null)))
                .isInstanceOf(NotFoundException.class);
    }
}
