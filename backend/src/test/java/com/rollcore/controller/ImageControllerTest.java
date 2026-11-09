package com.rollcore.controller;

import com.rollcore.config.SecurityConfig;
import com.rollcore.dto.response.ImageResponse;
import com.rollcore.entity.StoredImage;
import com.rollcore.exception.InvalidImageException;
import com.rollcore.exception.GlobalExceptionHandler;
import com.rollcore.exception.NotFoundException;
import com.rollcore.filter.JwtAuthFilter;
import com.rollcore.filter.RateLimitFilter;
import com.rollcore.service.ImageService;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Web-layer slice tests for {@link ImageController}; same setup as TableControllerTest. */
@WebMvcTest(
    controllers = ImageController.class,
    excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class
)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
@DisplayName("ImageController")
class ImageControllerTest {

    @Autowired MockMvc      mvc;
    @MockBean  ImageService imageService;

    @MockBean  com.rollcore.security.JwtService             jwtService;
    @MockBean  com.rollcore.security.UserDetailsServiceImpl userDetailsService;
    @SpyBean   JwtAuthFilter                                jwtAuthFilter;
    @SpyBean   RateLimitFilter                              rateLimitFilter;

    private static final UUID USER_ID  = UUID.randomUUID();
    private static final UUID IMAGE_ID = UUID.randomUUID();
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};

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

    @Test @DisplayName("POST /images → 201 with the relative url")
    void uploadOk() throws Exception {
        when(imageService.store(eq(USER_ID), any())).thenReturn(ImageResponse.of(IMAGE_ID));

        mvc.perform(multipart("/images").file(new MockMultipartFile("file", "c.png", "image/png", PNG))
                        .with(authentication(uuidAuth())).with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.url").value("/images/" + IMAGE_ID));
    }

    @Test @DisplayName("POST /images → 400 when the service rejects the file")
    void uploadInvalid() throws Exception {
        when(imageService.store(eq(USER_ID), any())).thenThrow(new InvalidImageException("nope"));

        mvc.perform(multipart("/images").file(new MockMultipartFile("file", "x.png", "image/png", new byte[]{1}))
                        .with(authentication(uuidAuth())).with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test @DisplayName("POST /images → 401 without authentication")
    void uploadUnauthenticated() throws Exception {
        mvc.perform(multipart("/images").file(new MockMultipartFile("file", "c.png", "image/png", PNG)))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(imageService);
    }

    @Test @DisplayName("GET /images/{id} is public and serves the bytes with hardening headers")
    void getPublic() throws Exception {
        when(imageService.get(IMAGE_ID)).thenReturn(StoredImage.builder()
                .id(IMAGE_ID).contentType("image/png").sizeBytes(PNG.length).data(PNG).build());

        mvc.perform(get("/images/{id}", IMAGE_ID))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().exists("Cache-Control"))
                .andExpect(content().bytes(PNG));
    }

    @Test @DisplayName("GET /images/{id} → 404 for an unknown id")
    void getUnknown() throws Exception {
        when(imageService.get(IMAGE_ID)).thenThrow(new NotFoundException("Image not found."));
        mvc.perform(get("/images/{id}", IMAGE_ID)).andExpect(status().isNotFound());
    }

    @Test @DisplayName("DELETE /images/{id} → 204")
    void deleteOk() throws Exception {
        mvc.perform(delete("/images/{id}", IMAGE_ID).with(authentication(uuidAuth())).with(csrf()))
                .andExpect(status().isNoContent());
        verify(imageService).delete(IMAGE_ID, USER_ID);
    }
}
