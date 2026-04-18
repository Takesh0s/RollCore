package com.rollcore.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollcore.dto.request.CharacterRequest;
import com.rollcore.dto.response.CharacterResponse;
import com.rollcore.exception.GlobalExceptionHandler;
import com.rollcore.exception.NotFoundException;
import com.rollcore.service.CharacterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web-layer slice tests for {@link CharacterController}.
 * Uses {@link WithMockUser} to inject a UUID principal into the security context.
 */
@WebMvcTest(CharacterController.class)
@Import(GlobalExceptionHandler.class)
@ActiveProfiles("test")
@DisplayName("CharacterController")
class CharacterControllerTest {

    @Autowired MockMvc          mvc;
    @Autowired ObjectMapper     mapper;
    @MockBean  CharacterService characterService;

    @MockBean com.rollcore.security.JwtService            jwtService;
    @MockBean com.rollcore.security.UserDetailsServiceImpl userDetailsService;
    @MockBean com.rollcore.filter.JwtAuthFilter            jwtAuthFilter;
    @MockBean com.rollcore.filter.RateLimitFilter          rateLimitFilter;

    private static final UUID CHAR_ID = UUID.randomUUID();

    private CharacterResponse fakeChar;
    private CharacterRequest  validRequest;

    @BeforeEach
    void setUp() {
        fakeChar = new CharacterResponse(
                CHAR_ID, "Aragorn", "Guerreiro", "", "Humano", 5,
                Map.of("STR", 17, "DEX", 14, "CON", 15, "INT", 10, "WIS", 11, "CHA", 12),
                38, 44, 0, 16, null, null,
                Instant.now(), Instant.now());

        validRequest = new CharacterRequest(
                "Aragorn", "Guerreiro", "", "Humano", 5,
                Map.of("STR", 17, "DEX", 14, "CON", 15, "INT", 10, "WIS", 11, "CHA", 12),
                38, 44, 0);
    }

    // ── GET /characters ───────────────────────────────────────────────────────

    @Test
    @WithMockUser
    @DisplayName("GET /characters → 200 with list")
    void listCharacters() throws Exception {
        when(characterService.listByUser(any())).thenReturn(List.of(fakeChar));

        mvc.perform(get("/characters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Aragorn"))
                .andExpect(jsonPath("$[0].characterClass").value("Guerreiro"));
    }

    // ── POST /characters ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /characters")
    class CreateTest {

        @Test
        @WithMockUser
        @DisplayName("201 with valid payload")
        void createSuccess() throws Exception {
            when(characterService.create(any(), any())).thenReturn(fakeChar);

            mvc.perform(post("/characters").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(validRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(CHAR_ID.toString()));
        }

        @Test
        @WithMockUser
        @DisplayName("400 when name is blank")
        void createMissingName() throws Exception {
            CharacterRequest bad = new CharacterRequest(
                    "", "Guerreiro", "", "Humano", 5,
                    Map.of("STR",10,"DEX",10,"CON",10,"INT",10,"WIS",10,"CHA",10),
                    10, 12, 0);

            mvc.perform(post("/characters").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(bad)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fields.name").isNotEmpty());
        }

        @Test
        @WithMockUser
        @DisplayName("400 when level exceeds 20")
        void createLevelTooHigh() throws Exception {
            CharacterRequest bad = new CharacterRequest(
                    "Gandalf", "Mago", "", "Humano", 21,
                    Map.of("STR",10,"DEX",10,"CON",10,"INT",20,"WIS",18,"CHA",15),
                    50, 60, 0);

            mvc.perform(post("/characters").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(bad)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fields.level").isNotEmpty());
        }
    }

    // ── GET /characters/{id} ──────────────────────────────────────────────────

    @Test
    @WithMockUser
    @DisplayName("GET /characters/{id} → 200 when found")
    void getByIdFound() throws Exception {
        when(characterService.getById(eq(CHAR_ID), any())).thenReturn(fakeChar);

        mvc.perform(get("/characters/{id}", CHAR_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Aragorn"));
    }

    @Test
    @WithMockUser
    @DisplayName("GET /characters/{id} → 404 when not found")
    void getByIdNotFound() throws Exception {
        when(characterService.getById(any(), any()))
                .thenThrow(new NotFoundException("Personagem não encontrado."));

        mvc.perform(get("/characters/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Personagem não encontrado."));
    }

    // ── DELETE /characters/{id} ───────────────────────────────────────────────

    @Test
    @WithMockUser
    @DisplayName("DELETE /characters/{id} → 204")
    void deleteCharacter() throws Exception {
        doNothing().when(characterService).delete(eq(CHAR_ID), any());

        mvc.perform(delete("/characters/{id}", CHAR_ID).with(csrf()))
                .andExpect(status().isNoContent());

        verify(characterService).delete(eq(CHAR_ID), any());
    }
}
