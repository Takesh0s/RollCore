package com.rollcore.controller;

import com.rollcore.config.SecurityConfig;
import com.rollcore.dto.request.ChangeEmailRequest;
import com.rollcore.dto.request.ChangePasswordRequest;
import com.rollcore.dto.request.UpdateProfileRequest;
import com.rollcore.dto.response.AuthResponse;
import com.rollcore.dto.response.UserProfileResponse;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.GlobalExceptionHandler;
import com.rollcore.filter.JwtAuthFilter;
import com.rollcore.filter.RateLimitFilter;
import com.rollcore.service.AccountService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Web-layer slice tests for {@link UserController}; same setup as TableControllerTest. */
@WebMvcTest(
    controllers = UserController.class,
    excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class
)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
@DisplayName("UserController")
class UserControllerTest {

    @Autowired MockMvc       mvc;
    @MockBean  AccountService accountService;

    @MockBean  com.rollcore.security.JwtService             jwtService;
    @MockBean  com.rollcore.security.UserDetailsServiceImpl userDetailsService;
    @SpyBean   JwtAuthFilter                                jwtAuthFilter;
    @SpyBean   RateLimitFilter                              rateLimitFilter;

    private static final UUID USER_ID = UUID.randomUUID();

    private static UsernamePasswordAuthenticationToken uuidAuth() {
        return new UsernamePasswordAuthenticationToken(
                USER_ID, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @BeforeEach
    void setUp() throws Exception {
        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2)).doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());

        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2)).doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(rateLimitFilter).doFilter(any(), any(), any());
    }

    @Test @DisplayName("GET /users/me → 200 with plan and quota")
    void meOk() throws Exception {
        when(accountService.me(USER_ID)).thenReturn(
                new UserProfileResponse(USER_ID, "luiz", "l@x.com", "FREE", 1, 1));

        mvc.perform(get("/users/me").with(authentication(uuidAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan").value("FREE"))
                .andExpect(jsonPath("$.tablesUsed").value(1))
                .andExpect(jsonPath("$.tablesLimit").value(1));
    }

    @Test @DisplayName("GET /users/me → 4xx without authentication")
    void meRequiresAuth() throws Exception {
        mvc.perform(get("/users/me")).andExpect(status().is4xxClientError());

        verifyNoInteractions(accountService);
    }

    @Test @DisplayName("PUT /users/me → 200 with the updated profile")
    void updateOk() throws Exception {
        when(accountService.updateMe(org.mockito.ArgumentMatchers.eq(USER_ID), any(UpdateProfileRequest.class)))
                .thenReturn(new UserProfileResponse(USER_ID, "novo_nome", "l@x.com", "FREE", 0, 1, null));

        mvc.perform(put("/users/me").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"novo_nome\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("novo_nome"));
    }

    @Test @DisplayName("PUT /users/me → 400 for an invalid username")
    void updateInvalid() throws Exception {
        mvc.perform(put("/users/me").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"a b\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(accountService);
    }

    @Test @DisplayName("PUT /users/me → 400 for a non-image avatar")
    void updateInvalidAvatar() throws Exception {
        mvc.perform(put("/users/me").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarUrl\":\"javascript:alert(1)\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(accountService);
    }

    // ── E-mail and password ──────────────────────────────────────────────────

    @Test @DisplayName("PUT /users/me/email → 200 with the updated profile")
    void emailOk() throws Exception {
        when(accountService.changeEmail(org.mockito.ArgumentMatchers.eq(USER_ID), any(ChangeEmailRequest.class)))
                .thenReturn(new UserProfileResponse(USER_ID, "luiz", "novo@x.com", "FREE", 0, 1));

        mvc.perform(put("/users/me/email").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEmail\":\"novo@x.com\",\"currentPassword\":\"Senha123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("novo@x.com"));
    }

    @Test @DisplayName("PUT /users/me/email → 400 for a malformed address, service untouched")
    void emailInvalid() throws Exception {
        mvc.perform(put("/users/me/email").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEmail\":\"nao-e-email\",\"currentPassword\":\"Senha123\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(accountService);
    }

    @Test @DisplayName("PUT /users/me/email → 403 when the current password is wrong")
    void emailWrongPassword() throws Exception {
        when(accountService.changeEmail(org.mockito.ArgumentMatchers.eq(USER_ID), any(ChangeEmailRequest.class)))
                .thenThrow(new ForbiddenException("Current password is incorrect."));

        mvc.perform(put("/users/me/email").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEmail\":\"novo@x.com\",\"currentPassword\":\"errada\"}"))
                .andExpect(status().isForbidden());
    }

    @Test @DisplayName("PUT /users/me/email → 409 when the address is taken")
    void emailTaken() throws Exception {
        when(accountService.changeEmail(org.mockito.ArgumentMatchers.eq(USER_ID), any(ChangeEmailRequest.class)))
                .thenThrow(new ConflictException("Email is already registered."));

        mvc.perform(put("/users/me/email").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEmail\":\"outro@x.com\",\"currentPassword\":\"Senha123\"}"))
                .andExpect(status().isConflict());
    }

    @Test @DisplayName("PUT /users/me/password → 200 with a fresh token pair")
    void passwordOk() throws Exception {
        when(accountService.changePassword(org.mockito.ArgumentMatchers.eq(USER_ID), any(ChangePasswordRequest.class)))
                .thenReturn(new AuthResponse("access", "refresh", USER_ID, "l@x.com", "luiz"));

        mvc.perform(put("/users/me/password").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Antiga123\",\"newPassword\":\"Nova12345\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access"))
                .andExpect(jsonPath("$.refreshToken").value("refresh"));
    }

    @Test @DisplayName("PUT /users/me/password → 400 for a weak new password")
    void passwordWeak() throws Exception {
        mvc.perform(put("/users/me/password").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Antiga123\",\"newPassword\":\"fraca\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(accountService);
    }

    @Test @DisplayName("PUT /users/me/password → 400 when the new password equals the current one")
    void passwordSame() throws Exception {
        mvc.perform(put("/users/me/password").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Mesma12345\",\"newPassword\":\"Mesma12345\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(accountService);
    }

    @Test @DisplayName("PUT /users/me/password → 4xx without authentication")
    void passwordRequiresAuth() throws Exception {
        mvc.perform(put("/users/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Antiga123\",\"newPassword\":\"Nova12345\"}"))
                .andExpect(status().is4xxClientError());

        verifyNoInteractions(accountService);
    }
}
