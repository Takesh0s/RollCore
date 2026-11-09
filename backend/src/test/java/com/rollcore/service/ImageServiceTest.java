package com.rollcore.service;

import com.rollcore.dto.response.ImageResponse;
import com.rollcore.entity.StoredImage;
import com.rollcore.entity.User;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.InvalidImageException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.StoredImageRepository;
import com.rollcore.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ImageService — envio de imagens")
class ImageServiceTest {

    @Mock StoredImageRepository images;
    @Mock UserRepository        users;

    private ImageService service;
    private final UUID userId = UUID.randomUUID();
    private User user;

    private static final byte[] PNG  = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0};
    private static final byte[] WEBP = {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'};

    @BeforeEach
    void setUp() {
        service = new ImageService(images, users, 1024, 2);
        user = User.builder().id(userId).username("gm").email("gm@x.com").passwordHash("h").build();
    }

    @Test @DisplayName("stores a PNG with the type detected from its bytes and returns a relative url")
    void storesPng() {
        UUID id = UUID.randomUUID();
        when(images.countByOwnerId(userId)).thenReturn(0L);
        when(users.findById(userId)).thenReturn(Optional.of(user));
        when(images.save(any(StoredImage.class))).thenAnswer(inv -> {
            StoredImage i = inv.getArgument(0);
            i.setId(id);
            return i;
        });

        ImageResponse r = service.store(userId, PNG);

        ArgumentCaptor<StoredImage> c = ArgumentCaptor.forClass(StoredImage.class);
        verify(images).save(c.capture());
        assertThat(c.getValue().getContentType()).isEqualTo("image/png");
        assertThat(c.getValue().getSizeBytes()).isEqualTo(PNG.length);
        assertThat(r.url()).isEqualTo("/images/" + id);
    }

    @Test @DisplayName("detects JPEG and WebP; rejects anything else, including an HTML file named .png")
    void detectsTypes() {
        assertThat(ImageService.detectType(JPEG)).isEqualTo("image/jpeg");
        assertThat(ImageService.detectType(WEBP)).isEqualTo("image/webp");
        assertThat(ImageService.detectType("<html><script>alert(1)</script></html>".getBytes())).isNull();
        assertThat(ImageService.detectType(new byte[]{1, 2})).isNull();
    }

    @Test @DisplayName("rejects empty, oversized and unsupported files without touching the database")
    void rejectsInvalid() {
        assertThatThrownBy(() -> service.store(userId, new byte[0])).isInstanceOf(InvalidImageException.class);
        byte[] big = Arrays.copyOf(PNG, 2048);
        assertThatThrownBy(() -> service.store(userId, big)).isInstanceOf(InvalidImageException.class);
        assertThatThrownBy(() -> service.store(userId, "GIF89a....".getBytes())).isInstanceOf(InvalidImageException.class);
        verifyNoInteractions(images);
    }

    @Test @DisplayName("rejects the upload when the user reached the image limit")
    void quota() {
        when(images.countByOwnerId(userId)).thenReturn(2L);
        assertThatThrownBy(() -> service.store(userId, PNG)).isInstanceOf(InvalidImageException.class);
        verify(images, never()).save(any());
    }

    @Test @DisplayName("get() returns the image or 404")
    void get() {
        UUID id = UUID.randomUUID();
        StoredImage img = StoredImage.builder().id(id).owner(user).contentType("image/png").sizeBytes(1).data(PNG).build();
        when(images.findById(id)).thenReturn(Optional.of(img));
        assertThat(service.get(id)).isSameAs(img);

        UUID other = UUID.randomUUID();
        when(images.findById(other)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.get(other)).isInstanceOf(NotFoundException.class);
    }

    @Test @DisplayName("only the uploader deletes an image")
    void delete() {
        UUID id = UUID.randomUUID();
        StoredImage img = StoredImage.builder().id(id).owner(user).contentType("image/png").sizeBytes(1).data(PNG).build();
        when(images.findById(id)).thenReturn(Optional.of(img));

        assertThatThrownBy(() -> service.delete(id, UUID.randomUUID())).isInstanceOf(ForbiddenException.class);
        verify(images, never()).delete(any());

        service.delete(id, userId);
        verify(images).delete(img);
    }
}
