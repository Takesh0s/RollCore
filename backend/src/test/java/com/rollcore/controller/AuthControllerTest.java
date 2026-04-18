package com.rollcore.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollcore.dto.request.LoginRequest;
import com.rollcore.dto.request.RefreshRequest;
import com.rollcore.dto.request.RegisterRequest;
import com.rollcore.dto.response.AuthResponse;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.GlobalExceptionHandler;
import com.rollcore.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web-layer slice tests for {@link AuthController}.
 * Spring Security is partially loaded — only the auth filter chain matters here.
 */
@WebMvcTest(AuthController.class)
@Import(GlobalExceptionHandler.class)
@ActiveProfiles("test")
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired MockMvc       mvc;
    @Autowired ObjectMapper  mapper;
    @MockBean  AuthService   authService;

    // Needed by SecurityConfig even in slice tests
    @MockBean com.rollcore.security.JwtService            jwtService;
    @MockBean com.rollcore.security.UserDetailsServiceImpl userDetailsService;
    @MockBean com.rollcore.filter.JwtAuthFilter            jwtAuthFilter;
    @MockBean com.rollcore.filter.RateLimitFilter          rateLimitFilter;

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

            RegisterRequest req = new RegisterRequest("PlayerOne", "player@rollcore.com", "Senha1!");

            mvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.username").value("PlayerOne"));
        }

        @Test
        @DisplayName("409 when email already exists — UC-01 A01 / MSG001")
        void registerEmailConflict() throws Exception {
            when(authService.register(any()))
                    .thenThrow(new ConflictException("E-mail já cadastrado."));

            RegisterRequest req = new RegisterRequest("PlayerOne", "taken@rollcore.com", "Senha1!");

            mvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.detail").value("E-mail já cadastrado."));
        }

        @Test
        @DisplayName("400 when username format is invalid")
        void registerBadUsername() throws Exception {
            // username contains space → fails regex
            RegisterRequest req = new RegisterRequest("Bad Name!", "player@rollcore.com", "Senha1!");

            mvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fields.username").isNotEmpty());
        }

        @Test
        @DisplayName("400 when password is too weak — UC-01 RN-01")
        void registerWeakPassword() throws Exception {
            RegisterRequest req = new RegisterRequest("PlayerOne", "player@rollcore.com", "weak");

            mvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
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

            LoginRequest req = new LoginRequest("player@rollcore.com", "Senha1!");

            mvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty());
        }

        @Test
        @DisplayName("401 with wrong credentials — UC-01 E01 / MSG003 (generic message)")
        void loginBadCredentials() throws Exception {
            when(authService.login(any()))
                    .thenThrow(new BadCredentialsException("Credenciais inválidas."));

            LoginRequest req = new LoginRequest("player@rollcore.com", "wrongpass");

            mvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized())
                    // UC-01 RN-03: must not reveal which field is wrong
                    .andExpect(jsonPath("$.detail").value("E-mail ou senha incorretos."));
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

            RefreshRequest req = new RefreshRequest("valid.refresh.token");

            mvc.perform(post("/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty());
        }

        @Test
        @DisplayName("401 with expired refresh token — UC-01 E03")
        void refreshExpired() throws Exception {
            when(authService.refresh(any()))
                    .thenThrow(new BadCredentialsException("Refresh token inválido ou expirado."));

            RefreshRequest req = new RefreshRequest("expired.token");

            mvc.perform(post("/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized());
        }
    }
}
