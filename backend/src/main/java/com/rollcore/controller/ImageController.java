package com.rollcore.controller;

import com.rollcore.dto.response.ImageResponse;
import com.rollcore.entity.StoredImage;
import com.rollcore.exception.InvalidImageException;
import com.rollcore.service.ImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

/**
 * Picture uploads (table covers, later maps).
 *
 * <pre>
 * POST   /images        → upload (multipart field "file"; JPEG / PNG / WebP, up to 2 MB)
 * GET    /images/{id}   → the picture (public: an img tag cannot send the token; the id is random)
 * DELETE /images/{id}   → remove (uploader only)
 * </pre>
 */
@Tag(name = "Images", description = "Picture uploads")
@RestController
@RequestMapping("/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @Operation(summary = "Upload a JPEG, PNG or WebP picture")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ImageResponse upload(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UUID userId) {
        try {
            return imageService.store(userId, file.getBytes());
        } catch (IOException e) {
            throw new InvalidImageException("The image could not be read.");
        }
    }

    @Operation(summary = "Download a picture (public)")
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> get(@PathVariable UUID id) {
        StoredImage image = imageService.get(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", "default-src 'none'; sandbox")
                .body(image.getData());
    }

    @Operation(summary = "Delete a picture (uploader only)")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        imageService.delete(id, userId);
    }
}
