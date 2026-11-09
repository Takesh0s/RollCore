package com.rollcore.service;

import com.rollcore.dto.request.ChangeEmailRequest;
import com.rollcore.dto.request.ChangePasswordRequest;
import com.rollcore.dto.request.UpdateProfileRequest;
import com.rollcore.dto.response.AuthResponse;
import com.rollcore.dto.response.UserProfileResponse;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.entity.User;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.GameTableRepository;
import com.rollcore.repository.UserRepository;
import com.rollcore.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

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
    @Mock PasswordEncoder     encoder;
    @Mock RefreshTokenService refreshTokens;
    @Mock JwtService          jwt;

    private AccountService service;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new AccountService(users, tables, encoder, refreshTokens, jwt, 1);
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

    // ── Change e-mail ────────────────────────────────────────────────────────

    @Test @DisplayName("changeEmail stores the new address trimmed and lowercase")
    void changeEmailOk() {
        User u = user(User.Plan.FREE);
        when(users.findById(userId)).thenReturn(Optional.of(u));
        when(encoder.matches("Senha123", "h")).thenReturn(true);
        when(users.existsByEmail("novo@x.com")).thenReturn(false);

        UserProfileResponse r = service.changeEmail(userId, new ChangeEmailRequest("  Novo@X.com ", "Senha123"));

        assertThat(r.email()).isEqualTo("novo@x.com");
        verify(users).save(u);
    }

    @Test @DisplayName("changeEmail with a wrong password → 403 and nothing saved")
    void changeEmailWrongPassword() {
        when(users.findById(userId)).thenReturn(Optional.of(user(User.Plan.FREE)));
        when(encoder.matches("errada", "h")).thenReturn(false);

        assertThatThrownBy(() -> service.changeEmail(userId, new ChangeEmailRequest("novo@x.com", "errada")))
                .isInstanceOf(ForbiddenException.class);
        verify(users, never()).save(any());
    }

    @Test @DisplayName("changeEmail to an address used by another account → 409")
    void changeEmailTaken() {
        when(users.findById(userId)).thenReturn(Optional.of(user(User.Plan.FREE)));
        when(encoder.matches("Senha123", "h")).thenReturn(true);
        when(users.existsByEmail("outro@x.com")).thenReturn(true);

        assertThatThrownBy(() -> service.changeEmail(userId, new ChangeEmailRequest("outro@x.com", "Senha123")))
                .isInstanceOf(ConflictException.class);
        verify(users, never()).save(any());
    }

    @Test @DisplayName("changeEmail to the same address is a no-op")
    void changeEmailSame() {
        when(users.findById(userId)).thenReturn(Optional.of(user(User.Plan.FREE)));
        when(encoder.matches("Senha123", "h")).thenReturn(true);

        UserProfileResponse r = service.changeEmail(userId, new ChangeEmailRequest("L@X.com", "Senha123"));

        assertThat(r.email()).isEqualTo("l@x.com");
        verify(users, never()).existsByEmail(any());
        verify(users, never()).save(any());
    }

    // ── Change password ──────────────────────────────────────────────────────

    @Test @DisplayName("changePassword re-hashes, signs out every device and returns a fresh session")
    void changePasswordOk() {
        User u = user(User.Plan.FREE);
        when(users.findById(userId)).thenReturn(Optional.of(u));
        when(encoder.matches("Antiga123", "h")).thenReturn(true);
        when(encoder.encode("Nova12345")).thenReturn("novo-hash");
        when(jwt.generateAccessToken(userId)).thenReturn("access");
        when(refreshTokens.startSession(userId)).thenReturn("refresh");

        AuthResponse r = service.changePassword(userId, new ChangePasswordRequest("Antiga123", "Nova12345"));

        assertThat(u.getPasswordHash()).isEqualTo("novo-hash");
        assertThat(r.accessToken()).isEqualTo("access");
        assertThat(r.refreshToken()).isEqualTo("refresh");
        assertThat(r.email()).isEqualTo("l@x.com");
        // old sessions are revoked BEFORE the new one starts, so the new one survives
        org.mockito.InOrder order = org.mockito.Mockito.inOrder(refreshTokens);
        order.verify(refreshTokens).revokeAllFor(userId);
        order.verify(refreshTokens).startSession(userId);
    }

    @Test @DisplayName("changePassword with a wrong current password → 403, no revoke")
    void changePasswordWrong() {
        when(users.findById(userId)).thenReturn(Optional.of(user(User.Plan.FREE)));
        when(encoder.matches("errada", "h")).thenReturn(false);

        assertThatThrownBy(() -> service.changePassword(userId, new ChangePasswordRequest("errada", "Nova12345")))
                .isInstanceOf(ForbiddenException.class);
        verify(users, never()).save(any());
        verify(refreshTokens, never()).revokeAllFor(any());
    }
}
