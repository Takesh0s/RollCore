package com.rollcore.controller;

import com.rollcore.dto.request.LoginRequest;
import com.rollcore.dto.request.RefreshRequest;
import com.rollcore.dto.request.RegisterRequest;
import com.rollcore.dto.response.AuthResponse;
import com.rollcore.dto.response.DeleteResponse;
import com.rollcore.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Authentication endpoints — UC-01.
 *
 * <pre>
 * POST /auth/register  → 201 Created   — user registration
 * POST /auth/login     → 200 OK        — user login
 * POST /auth/refresh   → 200 OK        — token refresh with rotation (S01)
 * POST /auth/logout    → 204           — revoke the refresh-token family
 * POST /auth/logout-all→ 204           — revoke every session (JWT required)
 * DELETE /auth/me      → 200 OK        — delete own account (JWT required)
 * </pre>
 *
 * register/login/refresh/logout are public; logout-all and /me require an access token.
 */
@Tag(name = "Auth", description = "User registration, login and token refresh — UC-01")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @Operation(summary = "Authenticate user and return token pair")
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @Operation(summary = "Refresh access token using refresh token — UC-01 S01")
    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @Operation(summary = "Revoke the given refresh token's whole session (idempotent)")
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request);
    }

    @Operation(summary = "Revoke every refresh token of the authenticated user",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/logout-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logoutAll(@AuthenticationPrincipal UUID userId) {
        authService.logoutAll(userId);
    }

    @Operation(summary = "Delete the authenticated user's own account",
               security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/me")
    public DeleteResponse deleteMe(@AuthenticationPrincipal UUID userId) {
        return authService.deleteAccount(userId);
    }
}
