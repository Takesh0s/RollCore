package com.rollcore.controller;

import com.rollcore.dto.response.UserProfileResponse;
import com.rollcore.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Account summary of the signed-in user. */
@Tag(name = "Users", description = "Account summary and plan — Fase 2c")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final AccountService accountService;

    @Operation(summary = "My profile, plan and table quota")
    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal UUID userId) {
        return accountService.me(userId);
    }
}
