package com.rollcore.controller;

import com.rollcore.config.SecurityConfig;
import com.rollcore.dto.response.NotificationListResponse;
import com.rollcore.dto.response.NotificationResponse;
import com.rollcore.exception.GlobalExceptionHandler;
import com.rollcore.exception.NotFoundException;
import com.rollcore.filter.JwtAuthFilter;
import com.rollcore.filter.RateLimitFilter;
import com.rollcore.service.NotificationService;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Web-layer slice tests for {@link NotificationController}; same setup as UserControllerTest. */
@WebMvcTest(
    controllers = NotificationController.class,
    excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class
)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
@DisplayName("NotificationController")
class NotificationControllerTest {

    @Autowired MockMvc             mvc;
    @MockBean  NotificationService notificationService;

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

    @Test @DisplayName("GET /notifications → 200 with items and unread total")
    void listOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(notificationService.list(USER_ID)).thenReturn(new NotificationListResponse(
                List.of(new NotificationResponse(id, "MEMBER_JOINED", UUID.randomUUID(), null, "Mesa", "ply", null,
                        false, Instant.parse("2026-11-09T12:00:00Z"))),
                1));

        mvc.perform(get("/notifications").with(authentication(uuidAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unread").value(1))
                .andExpect(jsonPath("$.items[0].id").value(id.toString()))
                .andExpect(jsonPath("$.items[0].type").value("MEMBER_JOINED"))
                .andExpect(jsonPath("$.items[0].read").value(false));
    }

    @Test @DisplayName("GET /notifications → 4xx without authentication")
    void listRequiresAuth() throws Exception {
        mvc.perform(get("/notifications")).andExpect(status().is4xxClientError());

        verifyNoInteractions(notificationService);
    }

    @Test @DisplayName("POST /notifications/{id}/read → 204")
    void markReadOk() throws Exception {
        UUID id = UUID.randomUUID();

        mvc.perform(post("/notifications/" + id + "/read").with(authentication(uuidAuth())))
                .andExpect(status().isNoContent());

        verify(notificationService).markRead(id, USER_ID);
    }

    @Test @DisplayName("POST /notifications/{id}/read → 404 for a notification that is not yours")
    void markReadNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new NotFoundException("Notification not found.")).when(notificationService).markRead(id, USER_ID);

        mvc.perform(post("/notifications/" + id + "/read").with(authentication(uuidAuth())))
                .andExpect(status().isNotFound());
    }

    @Test @DisplayName("POST /notifications/read-all → 204")
    void markAllReadOk() throws Exception {
        mvc.perform(post("/notifications/read-all").with(authentication(uuidAuth())))
                .andExpect(status().isNoContent());

        verify(notificationService).markAllRead(USER_ID);
    }
}
