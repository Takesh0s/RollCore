package com.rollcore.controller;

import com.rollcore.config.SecurityConfig;
import com.rollcore.dto.request.MapRequest;
import com.rollcore.dto.response.MapResponse;
import com.rollcore.entity.GameMap.GridType;
import com.rollcore.entity.GameMap.Kind;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.GlobalExceptionHandler;
import com.rollcore.exception.InvalidMapException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.filter.JwtAuthFilter;
import com.rollcore.filter.RateLimitFilter;
import com.rollcore.service.MapService;
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Web-layer slice tests for {@link MapController}; same setup as NotificationControllerTest. */
@WebMvcTest(
    controllers = MapController.class,
    excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class
)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
@DisplayName("MapController")
class MapControllerTest {

    @Autowired MockMvc    mvc;
    @MockBean  MapService mapService;

    @MockBean  com.rollcore.security.JwtService             jwtService;
    @MockBean  com.rollcore.security.UserDetailsServiceImpl userDetailsService;
    @SpyBean   JwtAuthFilter                                jwtAuthFilter;
    @SpyBean   RateLimitFilter                              rateLimitFilter;

    private static final UUID USER_ID = UUID.randomUUID();

    private static final String BODY = """
            {"name":"Cripta do Lich","kind":"MEDIEVAL","gridType":"HEX","cols":30,"rows":20,"cellSize":48,
             "layers":"{}","gridVisible":true,"fogEnabled":false}""";

    private static UsernamePasswordAuthenticationToken uuidAuth() {
        return new UsernamePasswordAuthenticationToken(
                USER_ID, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    private static MapResponse response(UUID id, boolean mine) {
        return new MapResponse(id, "Cripta do Lich", Kind.MEDIEVAL, GridType.HEX, 30, 20, 48,
                null, "{}", true, false, false, "gm", mine, Instant.parse("2026-11-09T12:00:00Z"));
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

    @Test @DisplayName("GET /maps → 200 with the library")
    void listOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(mapService.mine(USER_ID)).thenReturn(List.of(response(id, true)));

        mvc.perform(get("/maps").with(authentication(uuidAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id.toString()))
                .andExpect(jsonPath("$[0].gridType").value("HEX"))
                .andExpect(jsonPath("$[0].mine").value(true));
    }

    @Test @DisplayName("GET /maps → 4xx without authentication")
    void listRequiresAuth() throws Exception {
        mvc.perform(get("/maps")).andExpect(status().is4xxClientError());

        verifyNoInteractions(mapService);
    }

    @Test @DisplayName("POST /maps → 201 with the created map")
    void createOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(mapService.create(eq(USER_ID), any(MapRequest.class))).thenReturn(response(id, true));

        mvc.perform(post("/maps").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test @DisplayName("POST /maps → 400 when the name is missing or the size is out of range")
    void createValidation() throws Exception {
        String bad = """
                {"kind":"MEDIEVAL","gridType":"SQUARE","cols":3,"rows":20,"cellSize":48}""";

        mvc.perform(post("/maps").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON).content(bad))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.name").exists())
                .andExpect(jsonPath("$.fields.cols").exists());

        verifyNoInteractions(mapService);
    }

    @Test @DisplayName("POST /maps → 400 for an unknown kind")
    void createUnknownKind() throws Exception {
        String bad = BODY.replace("MEDIEVAL", "STEAMY");

        mvc.perform(post("/maps").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON).content(bad))
                .andExpect(status().isBadRequest());
    }

    @Test @DisplayName("POST /maps → 409 at the library limit")
    void createLimit() throws Exception {
        when(mapService.create(eq(USER_ID), any(MapRequest.class))).thenThrow(new ConflictException("Map limit reached."));

        mvc.perform(post("/maps").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isConflict());
    }

    @Test @DisplayName("POST /maps → 400 when the service rejects the layers")
    void createInvalidLayers() throws Exception {
        when(mapService.create(eq(USER_ID), any(MapRequest.class))).thenThrow(new InvalidMapException("bad layers"));

        mvc.perform(post("/maps").with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("bad layers"));
    }

    @Test @DisplayName("GET /maps/{id} → 200, and 404 when it is hidden or missing")
    void getOneAndNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        UUID hidden = UUID.randomUUID();
        when(mapService.get(id, USER_ID)).thenReturn(response(id, false));
        when(mapService.get(hidden, USER_ID)).thenThrow(new NotFoundException("Map not found."));

        mvc.perform(get("/maps/" + id).with(authentication(uuidAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mine").value(false));
        mvc.perform(get("/maps/" + hidden).with(authentication(uuidAuth())))
                .andExpect(status().isNotFound());
    }

    @Test @DisplayName("PUT /maps/{id} → 200, and 403 for someone else's map")
    void updateOkAndForbidden() throws Exception {
        UUID id = UUID.randomUUID();
        UUID foreign = UUID.randomUUID();
        when(mapService.update(eq(id), eq(USER_ID), any(MapRequest.class))).thenReturn(response(id, true));
        when(mapService.update(eq(foreign), eq(USER_ID), any(MapRequest.class)))
                .thenThrow(new ForbiddenException("Only the author can change this map."));

        mvc.perform(put("/maps/" + id).with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk());
        mvc.perform(put("/maps/" + foreign).with(authentication(uuidAuth()))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isForbidden());
    }

    @Test @DisplayName("DELETE /maps/{id} → 204")
    void deleteOk() throws Exception {
        UUID id = UUID.randomUUID();

        mvc.perform(delete("/maps/" + id).with(authentication(uuidAuth())))
                .andExpect(status().isNoContent());

        verify(mapService).delete(id, USER_ID);
    }

    @Test @DisplayName("DELETE /maps/{id} → 403 for someone else's map")
    void deleteForbidden() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ForbiddenException("Only the author can change this map.")).when(mapService).delete(id, USER_ID);

        mvc.perform(delete("/maps/" + id).with(authentication(uuidAuth())))
                .andExpect(status().isForbidden());
    }

    @Test @DisplayName("POST /maps/{id}/publish and /unpublish → 200")
    void publishAndUnpublish() throws Exception {
        UUID id = UUID.randomUUID();
        when(mapService.setPublished(id, USER_ID, true)).thenReturn(response(id, true));
        when(mapService.setPublished(id, USER_ID, false)).thenReturn(response(id, true));

        mvc.perform(post("/maps/" + id + "/publish").with(authentication(uuidAuth())))
                .andExpect(status().isOk());
        mvc.perform(post("/maps/" + id + "/unpublish").with(authentication(uuidAuth())))
                .andExpect(status().isOk());

        verify(mapService).setPublished(id, USER_ID, true);
        verify(mapService).setPublished(id, USER_ID, false);
    }

    @Test @DisplayName("POST /maps/{id}/copy → 201")
    void copyOk() throws Exception {
        UUID id = UUID.randomUUID();
        UUID copyId = UUID.randomUUID();
        when(mapService.copy(id, USER_ID)).thenReturn(response(copyId, true));

        mvc.perform(post("/maps/" + id + "/copy").with(authentication(uuidAuth())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(copyId.toString()));
    }

    @Test @DisplayName("GET /maps/community → 200, forwarding the search and the kind")
    void communityOk() throws Exception {
        UUID id = UUID.randomUUID();
        when(mapService.community(USER_ID, "cripta", Kind.PIRATE)).thenReturn(List.of(response(id, false)));
        when(mapService.community(USER_ID, null, null)).thenReturn(List.of());

        mvc.perform(get("/maps/community").param("q", "cripta").param("kind", "PIRATE")
                        .with(authentication(uuidAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id.toString()));
        mvc.perform(get("/maps/community").with(authentication(uuidAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test @DisplayName("GET /maps/community → 400 for an unknown kind")
    void communityBadKind() throws Exception {
        mvc.perform(get("/maps/community").param("kind", "STEAMY").with(authentication(uuidAuth())))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(mapService);
    }
}
