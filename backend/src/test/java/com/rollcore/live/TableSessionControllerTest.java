package com.rollcore.live;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollcore.config.SecurityConfig;
import com.rollcore.dto.request.RollRequest;
import com.rollcore.exception.GlobalExceptionHandler;
import com.rollcore.exception.InvalidFormulaException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.filter.JwtAuthFilter;
import com.rollcore.filter.RateLimitFilter;
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
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = TableSessionController.class,
    excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class
)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
@DisplayName("TableSessionController")
class TableSessionControllerTest {

    @Autowired MockMvc      mvc;
    @Autowired ObjectMapper mapper;
    @MockBean  TableSessionService sessions;

    @MockBean  com.rollcore.security.JwtService             jwtService;
    @MockBean  com.rollcore.security.UserDetailsServiceImpl userDetailsService;
    @SpyBean   JwtAuthFilter                                jwtAuthFilter;
    @SpyBean   RateLimitFilter                              rateLimitFilter;

    private static final UUID USER_ID  = UUID.randomUUID();
    private static final UUID TABLE_ID = UUID.randomUUID();

    private static UsernamePasswordAuthenticationToken uuidAuth() {
        return new UsernamePasswordAuthenticationToken(
                USER_ID, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    private static TableRollEvent event() {
        return new TableRollEvent(UUID.randomUUID(), USER_ID, "ana", "Aelar", "2d6+3",
                List.of(4, 2), 3, 9, Instant.now());
    }

    @BeforeEach
    void bypassFilters() throws Exception {
        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2)).doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());

        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2)).doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(rateLimitFilter).doFilter(any(), any(), any());
    }

    @Test @DisplayName("POST /tables/{id}/rolls → 201 with the roll event")
    void rollOk() throws Exception {
        when(sessions.roll(eq(TABLE_ID), eq(USER_ID), any())).thenReturn(event());

        mvc.perform(post("/tables/{id}/rolls", TABLE_ID).with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new RollRequest("2d6+3"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.total").value(9))
                .andExpect(jsonPath("$.displayName").value("Aelar"));
    }

    @Test @DisplayName("POST /tables/{id}/rolls → 400 for a blank formula")
    void rollBlank() throws Exception {
        mvc.perform(post("/tables/{id}/rolls", TABLE_ID).with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"formula\":\"\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(sessions);
    }

    @Test @DisplayName("POST /tables/{id}/rolls → 400 for an invalid formula")
    void rollInvalidFormula() throws Exception {
        when(sessions.roll(eq(TABLE_ID), eq(USER_ID), any())).thenThrow(new InvalidFormulaException("zz"));

        mvc.perform(post("/tables/{id}/rolls", TABLE_ID).with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new RollRequest("zz"))))
                .andExpect(status().isBadRequest());
    }

    @Test @DisplayName("POST /tables/{id}/rolls → 404 for a non-member")
    void rollNonMember() throws Exception {
        when(sessions.roll(eq(TABLE_ID), eq(USER_ID), any())).thenThrow(new NotFoundException("Table not found."));

        mvc.perform(post("/tables/{id}/rolls", TABLE_ID).with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new RollRequest("1d20"))))
                .andExpect(status().isNotFound());
    }

    @Test @DisplayName("GET /tables/{id}/rolls → 200 with the history")
    void history() throws Exception {
        when(sessions.history(eq(TABLE_ID), eq(USER_ID), eq(10))).thenReturn(List.of(event()));

        mvc.perform(get("/tables/{id}/rolls", TABLE_ID).param("limit", "10").with(authentication(uuidAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].formula").value("2d6+3"));
    }

    @Test @DisplayName("GET /tables/{id}/presence → 200 with who is online")
    void presence() throws Exception {
        when(sessions.presence(TABLE_ID, USER_ID)).thenReturn(
                new PresenceEvent(TABLE_ID, List.of(new PresenceEvent.Online(USER_ID, "ana"))));

        mvc.perform(get("/tables/{id}/presence", TABLE_ID).with(authentication(uuidAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.online[0].username").value("ana"));
    }

    @Test @DisplayName("the live endpoints require authentication")
    void requiresAuth() throws Exception {
        mvc.perform(get("/tables/{id}/rolls", TABLE_ID)).andExpect(status().is4xxClientError());
        mvc.perform(post("/tables/{id}/rolls", TABLE_ID).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"formula\":\"1d20\"}"))
                .andExpect(status().is4xxClientError());

        verifyNoInteractions(sessions);
    }
}
