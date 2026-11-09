package com.rollcore.service;

import com.rollcore.dto.response.ImageResponse;
import com.rollcore.entity.StoredImage;
import com.rollcore.entity.User;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.InvalidImageException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.StoredImageRepository;
import com.rollcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Picture uploads. The type is detected from the file's first bytes, never from the
 * client-declared content type, so only real JPEG / PNG / WebP data is stored (and served).
 */
@Service
public class ImageService {

    private final StoredImageRepository images;
    private final UserRepository        users;
    private final int                   maxBytes;
    private final int                   maxPerUser;

    public ImageService(StoredImageRepository images,
                        UserRepository users,
                        @Value("${rollcore.images.max-bytes:2097152}") int maxBytes,
                        @Value("${rollcore.images.max-per-user:50}") int maxPerUser) {
        this.images = images;
        this.users = users;
        this.maxBytes = maxBytes;
        this.maxPerUser = maxPerUser;
    }

    @Transactional
    public ImageResponse store(UUID userId, byte[] bytes) {
        if (bytes == null || bytes.length == 0) throw new InvalidImageException("The image is empty.");
        if (bytes.length > maxBytes) {
            throw new InvalidImageException("The image is larger than " + (maxBytes / 1024 / 1024) + " MB.");
        }
        String type = detectType(bytes);
        if (type == null) throw new InvalidImageException("Only JPEG, PNG and WebP images are accepted.");
        if (images.countByOwnerId(userId) >= maxPerUser) {
            throw new InvalidImageException("Image limit reached. Delete an unused image first.");
        }

        User owner = users.findById(userId).orElseThrow(() -> new NotFoundException("User not found."));
        StoredImage saved = images.save(StoredImage.builder()
                .owner(owner).contentType(type).sizeBytes(bytes.length).data(bytes).build());
        return ImageResponse.of(saved.getId());
    }

    @Transactional(readOnly = true)
    public StoredImage get(UUID id) {
        return images.findById(id).orElseThrow(() -> new NotFoundException("Image not found."));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        StoredImage image = images.findById(id).orElseThrow(() -> new NotFoundException("Image not found."));
        if (!image.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("Only the uploader can delete this image.");
        }
        images.delete(image);
    }

    /** JPEG, PNG or WebP by magic bytes; {@code null} for anything else. */
    static String detectType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "image/png";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        return null;
    }
}
