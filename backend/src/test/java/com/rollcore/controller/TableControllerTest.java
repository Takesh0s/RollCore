package com.rollcore.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollcore.config.SecurityConfig;
import com.rollcore.dto.request.CreateTableRequest;
import com.rollcore.dto.request.JoinTableRequest;
import com.rollcore.dto.response.MemberSelfResponse;
import com.rollcore.dto.response.TableDetailResponse;
import com.rollcore.dto.response.TableSummaryResponse;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.GlobalExceptionHandler;
import com.rollcore.exception.NotFoundException;
import com.rollcore.filter.JwtAuthFilter;
import com.rollcore.filter.RateLimitFilter;
import com.rollcore.service.TableService;
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
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web-layer slice tests for {@link TableController}; same setup as CharacterControllerTest
 * (real SecurityConfig, pass-through filters, UUID principal).
 */
@WebMvcTest(
    controllers = TableController.class,
    excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class
)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
@DisplayName("TableController")
class TableControllerTest {

    @Autowired MockMvc      mvc;
    @Autowired ObjectMapper mapper;
    @MockBean  TableService tableService;

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

    private TableDetailResponse fakeDetail;

    @BeforeEach
    void setUp() throws Exception {
        TableSummaryResponse summary = new TableSummaryResponse(
                TABLE_ID, "Em busca dos esquecidos", "D&D 5e", null, 5, 1, null,
                "MASTER", "gm", Instant.now());
        fakeDetail = new TableDetailResponse(summary, "ABCD2345", List.of(),
                new MemberSelfResponse(null, null, false, "MASTER"));

        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2)).doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());

        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2)).doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(rateLimitFilter).doFilter(any(), any(), any());
    }

    @Test @DisplayName("POST /tables → 201 with a valid payload")
    void createOk() throws Exception {
        when(tableService.create(eq(USER_ID), any())).thenReturn(fakeDetail);

        mvc.perform(post("/tables").with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(
                                new CreateTableRequest("Em busca dos esquecidos", "D&D 5e", null, 5, null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.table.name").value("Em busca dos esquecidos"))
                .andExpect(jsonPath("$.inviteCode").value("ABCD2345"));
    }

    @Test @DisplayName("POST /tables → 400 for a too-short name and an invalid cover URL")
    void createInvalid() throws Exception {
        mvc.perform(post("/tables").with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(
                                new CreateTableRequest("ab", null, null, 99, "javascript:alert(1)"))))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(tableService);
    }

    @Test @DisplayName("POST /tables → 401/403 without authentication")
    void createRequiresAuth() throws Exception {
        mvc.perform(post("/tables").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(
                                new CreateTableRequest("Mesa de teste", null, null, null, null))))
                .andExpect(status().is4xxClientError());

        verifyNoInteractions(tableService);
    }

    @Test @DisplayName("GET /tables → 200 with the list")
    void listOk() throws Exception {
        when(tableService.list(USER_ID)).thenReturn(List.of(fakeDetail.table()));

        mvc.perform(get("/tables").with(authentication(uuidAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].myRole").value("MASTER"));
    }

    @Test @DisplayName("GET /tables/{id} → 404 when the service hides the table")
    void getNotFound() throws Exception {
        when(tableService.get(TABLE_ID, USER_ID)).thenThrow(new NotFoundException("Table not found."));

        mvc.perform(get("/tables/{id}", TABLE_ID).with(authentication(uuidAuth())))
                .andExpect(status().isNotFound());
    }

    @Test @DisplayName("POST /tables/join → 409 when the table is full")
    void joinFull() throws Exception {
        when(tableService.join(eq(USER_ID), any())).thenThrow(new ConflictException("This table is full."));

        mvc.perform(post("/tables/join").with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new JoinTableRequest("ABCD2345"))))
                .andExpect(status().isConflict());
    }

    @Test @DisplayName("DELETE /tables/{id} → 204 for the master, 403 for others")
    void deleteRules() throws Exception {
        mvc.perform(delete("/tables/{id}", TABLE_ID).with(authentication(uuidAuth())).with(csrf()))
                .andExpect(status().isNoContent());

        doThrow(new ForbiddenException("Only the table master can delete the table."))
                .when(tableService).delete(TABLE_ID, USER_ID);

        mvc.perform(delete("/tables/{id}", TABLE_ID).with(authentication(uuidAuth())).with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test @DisplayName("PATCH /tables/{id}/members/{userId}/role → 400 for MASTER")
    void roleCannotBeMaster() throws Exception {
        mvc.perform(patch("/tables/{id}/members/{uid}/role", TABLE_ID, UUID.randomUUID())
                        .with(authentication(uuidAuth())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"MASTER\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(tableService);
    }
}
