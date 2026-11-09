package com.rollcore.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollcore.config.SecurityConfig;
import com.rollcore.dto.request.RsvpRequest;
import com.rollcore.dto.response.EventResponse;
import com.rollcore.entity.TableEventRsvp.Status;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.GlobalExceptionHandler;
import com.rollcore.filter.JwtAuthFilter;
import com.rollcore.filter.RateLimitFilter;
import com.rollcore.service.TableEventService;
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

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Web-layer slice tests for {@link EventController}; same setup as TableControllerTest. */
@WebMvcTest(
    controllers = EventController.class,
    excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class
)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
@DisplayName("EventController")
class EventControllerTest {

    @Autowired MockMvc      mvc;
    @Autowired ObjectMapper mapper;
    @MockBean  TableEventService eventService;

    @MockBean  com.rollcore.security.JwtService             jwtService;
    @MockBean  com.rollcore.security.UserDetailsServiceImpl userDetailsService;
    @SpyBean   JwtAuthFilter                                jwtAuthFilter;
    @SpyBean   RateLimitFilter                              rateLimitFilter;

    private static final UUID USER_ID  = UUID.randomUUID();
    private static final UUID TABLE_ID = UUID.randomUUID();
    private static final UUID EVENT_ID = UUID.randomUUID();

    private static UsernamePasswordAuthenticationToken uuidAuth() {
        return new UsernamePasswordAuthenticationToken(
                USER_ID, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    private EventResponse fake;

    private static final String VALID_BODY =
            "{\"title\":\"Sessão 13\",\"date\":\"2026-11-20\",\"start\":\"20:00\",\"end\":\"23:00\"}";

    @BeforeEach
    void setUp() throws Exception {
        fake = new EventResponse(EVENT_ID, TABLE_ID, "Em busca dos esquecidos", "Sessão 13", null,
                LocalDate.of(2026, 11, 20), LocalTime.of(20, 0), LocalTime.of(23, 0),
                "NONE", "BLUE", true, "gm", List.of("gm", "ply"), Map.of("gm", "YES"));

        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2)).doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());

        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2)).doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(rateLimitFilter).doFilter(any(), any(), any());
    }

    @Test @DisplayName("GET /events → 200 with times as HH:mm")
    void list() throws Exception {
        when(eventService.list(USER_ID)).thenReturn(List.of(fake));

        mvc.perform(get("/events").with(authentication(uuidAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].start").value("20:00"))
                .andExpect(jsonPath("$[0].date").value("2026-11-20"))
                .andExpect(jsonPath("$[0].rsvp.gm").value("YES"));
    }

    @Test @DisplayName("GET /events → 401 without authentication")
    void listUnauthenticated() throws Exception {
        mvc.perform(get("/events")).andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("POST /tables/{id}/events → 201 with a valid payload")
    void createOk() throws Exception {
        when(eventService.create(eq(TABLE_ID), eq(USER_ID), any())).thenReturn(fake);

        mvc.perform(post("/tables/{id}/events", TABLE_ID).with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Sessão 13"));
    }

    @Test @DisplayName("POST /tables/{id}/events → 400 when the end is not after the start")
    void createInvalidRange() throws Exception {
        String body = "{\"title\":\"Sessão 13\",\"date\":\"2026-11-20\",\"start\":\"23:00\",\"end\":\"20:00\"}";

        mvc.perform(post("/tables/{id}/events", TABLE_ID).with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(eventService);
    }

    @Test @DisplayName("POST /tables/{id}/events → 400 for a too-short title")
    void createInvalidTitle() throws Exception {
        String body = "{\"title\":\"ab\",\"date\":\"2026-11-20\",\"start\":\"20:00\",\"end\":\"23:00\"}";

        mvc.perform(post("/tables/{id}/events", TABLE_ID).with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test @DisplayName("POST /tables/{id}/events → 403 when the service refuses")
    void createForbidden() throws Exception {
        when(eventService.create(eq(TABLE_ID), eq(USER_ID), any())).thenThrow(new ForbiddenException("no"));

        mvc.perform(post("/tables/{id}/events", TABLE_ID).with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isForbidden());
    }

    @Test @DisplayName("PUT /events/{id}/rsvp → 200 and 400 for an unknown status")
    void rsvp() throws Exception {
        when(eventService.respond(eq(EVENT_ID), eq(USER_ID), any())).thenReturn(fake);

        mvc.perform(put("/events/{id}/rsvp", EVENT_ID).with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new RsvpRequest(Status.YES))))
                .andExpect(status().isOk());

        mvc.perform(put("/events/{id}/rsvp", EVENT_ID).with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PENDING\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test @DisplayName("DELETE /events/{id} → 204")
    void deleteOk() throws Exception {
        mvc.perform(delete("/events/{id}", EVENT_ID).with(authentication(uuidAuth())).with(csrf()))
                .andExpect(status().isNoContent());
        verify(eventService).delete(EVENT_ID, USER_ID);
    }
}
