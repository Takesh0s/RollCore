package com.rollcore.controller;

import com.rollcore.dto.response.DeleteResponse;
import com.rollcore.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test-support endpoint used by the Playwright suite / Postman to reset users.
 *
 * <p>Registered ONLY when {@code rollcore.e2e-cleanup.enabled=true}
 * (env {@code E2E_CLEANUP_ENABLED=true}). It does not exist by default, so it is
 * absent in production.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "rollcore.e2e-cleanup.enabled", havingValue = "true")
public class E2eSupportController {

    private final AuthService authService;

    @DeleteMapping("/deleteall")
    public DeleteResponse deleteAll() {
        return authService.deleteAllForE2e();
    }
}
