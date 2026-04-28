package com.rollcore.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollcore.config.SecurityConfig;
import com.rollcore.dto.request.LoginRequest;
import com.rollcore.dto.request.RefreshRequest;
import com.rollcore.dto.request.RegisterRequest;
import com.rollcore.dto.response.AuthResponse;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.GlobalExceptionHandler;
import com.rollcore.filter.JwtAuthFilter;
import com.rollcore.filter.RateLimitFilter;
import com.rollcore.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web-layer slice tests for {@link AuthController}.
 *
 * Imports {@link SecurityConfig} so the real permit-all rules apply to
 * /auth/register, /auth/login and /auth/refresh.
 *
 * JwtAuthFilter and RateLimitFilter are @SpyBean so Spring injects real
 * instances into SecurityConfig, but we override doFilter() to simply delegate
 * to chain.doFilter() — bypassing JWT validation and rate limiting in tests.
 */
@WebMvcTest(
    controllers = AuthController.class,
    excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class
)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired MockMvc      mvc;
    @Autowired ObjectMapper mapper;
    @MockBean  AuthService  authService;

    @MockBean  com.rollcore.security.JwtService             jwtService;
    @MockBean  com.rollcore.security.UserDetailsServiceImpl userDetailsService;
    @SpyBean   JwtAuthFilter                                jwtAuthFilter;
    @SpyBean   RateLimitFilter                              rateLimitFilter;

    @BeforeEach
    void bypassFilters() throws Exception {
        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2)).doFilter(
                    inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());

        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2)).doFilter(
                    inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(rateLimitFilter).doFilter(any(), any(), any());
    }

    private static final AuthResponse FAKE_RESPONSE = new AuthResponse(
            "access.token.here",
            "refresh.token.here",
            UUID.randomUUID(),
            "player@rollcore.com",
            "PlayerOne");

    // ── POST /auth/register ───────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /auth/register")
    class RegisterTest {

        @Test
        @DisplayName("201 with valid payload")
        void registerSuccess() throws Exception {
            when(authService.register(any())).thenReturn(FAKE_RESPONSE);

            mvc.perform(post("/auth/register").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(
                                    new RegisterRequest("PlayerOne", "player@rollcore.com", "Senha123"))))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.username").value("PlayerOne"));
        }

        @Test
        @DisplayName("409 when email already exists — UC-01 A01 / MSG001")
        void registerEmailConflict() throws Exception {
            when(authService.register(any()))
                    .thenThrow(new ConflictException("E-mail já cadastrado."));

            mvc.perform(post("/auth/register").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(
                                    new RegisterRequest("PlayerOne", "taken@rollcore.com", "Senha123"))))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.detail").value("E-mail já cadastrado."));
        }

        @Test
        @DisplayName("400 when username format is invalid")
        void registerBadUsername() throws Exception {
            mvc.perform(post("/auth/register").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(
                                    new RegisterRequest("Bad Name!", "player@rollcore.com", "Senha123"))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fields.username").isNotEmpty());
        }

        @Test
        @DisplayName("400 when password is too weak — UC-01 RN-01")
        void registerWeakPassword() throws Exception {
            mvc.perform(post("/auth/register").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(
                                    new RegisterRequest("PlayerOne", "player@rollcore.com", "weak"))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fields.password").isNotEmpty());
        }
    }

    // ── POST /auth/login ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /auth/login")
    class LoginTest {

        @Test
        @DisplayName("200 with valid credentials")
        void loginSuccess() throws Exception {
            when(authService.login(any())).thenReturn(FAKE_RESPONSE);

            mvc.perform(post("/auth/login").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(
                                    new LoginRequest("player@rollcore.com", "Senha1!"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty());
        }

        @Test
        @DisplayName("401 with wrong credentials — UC-01 E01 / MSG003")
        void loginBadCredentials() throws Exception {
            when(authService.login(any()))
                    .thenThrow(new BadCredentialsException("Credenciais inválidas."));

            mvc.perform(post("/auth/login").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(
                                    new LoginRequest("player@rollcore.com", "wrongpass"))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.detail").value("Email or password is incorrect."));
        }
    }

    // ── POST /auth/refresh ────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /auth/refresh")
    class RefreshTest {

        @Test
        @DisplayName("200 with valid refresh token — UC-01 S01")
        void refreshSuccess() throws Exception {
            when(authService.refresh(any())).thenReturn(FAKE_RESPONSE);

            mvc.perform(post("/auth/refresh").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(
                                    new RefreshRequest("valid.refresh.token"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty());
        }

        @Test
        @DisplayName("401 with expired refresh token — UC-01 E03")
        void refreshExpired() throws Exception {
            when(authService.refresh(any()))
                    .thenThrow(new BadCredentialsException("Refresh token inválido."));

            mvc.perform(post("/auth/refresh").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(
                                    new RefreshRequest("expired.token"))))
                    .andExpect(status().isUnauthorized());
        }
    }
}