package com.rollcore.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollcore.dto.request.MapRequest;
import com.rollcore.dto.response.MapResponse;
import com.rollcore.entity.GameMap;
import com.rollcore.entity.GameMap.GridType;
import com.rollcore.entity.GameMap.Kind;
import com.rollcore.entity.User;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.InvalidMapException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.GameMapRepository;
import com.rollcore.repository.StoredImageRepository;
import com.rollcore.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("MapService — library, saving, publishing and copying")
class MapServiceTest {

    @Mock GameMapRepository     maps;
    @Mock UserRepository        users;
    @Mock StoredImageRepository images;

    private MapService service;

    private final UUID userId  = UUID.randomUUID();
    private final UUID otherId = UUID.randomUUID();
    private User me;
    private User other;

    @BeforeEach
    void setUp() {
        service = new MapService(maps, users, images, new ObjectMapper(), 2);
        me    = User.builder().id(userId).username("gm").email("gm@x.com").passwordHash("h").build();
        other = User.builder().id(otherId).username("autor").email("a@x.com").passwordHash("h").build();
    }

    private MapRequest request(UUID imageId, String layers) {
        return new MapRequest("  Cripta  ", Kind.MEDIEVAL, GridType.SQUARE, 30, 20, 48, imageId, layers, null, null);
    }

    private GameMap map(User owner, UUID imageId, boolean published) {
        return GameMap.builder().id(UUID.randomUUID()).owner(owner).name("Cripta")
                .kind(Kind.MEDIEVAL).gridType(GridType.SQUARE).cols(30).rows(20).cellSize(48)
                .imageId(imageId).layers("{\"cells\":{\"grass\":[1,2]}}").published(published).build();
    }

    private void saveReturnsArgument() {
        when(maps.save(any(GameMap.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // ── create ──────────────────────────────────────────────────────────────

    @Test @DisplayName("create() trims the name and applies the defaults")
    void createDefaults() {
        when(maps.countByOwnerId(userId)).thenReturn(0L);
        when(users.findById(userId)).thenReturn(Optional.of(me));
        saveReturnsArgument();

        MapResponse res = service.create(userId, request(null, null));

        assertThat(res.name()).isEqualTo("Cripta");
        assertThat(res.layers()).isEqualTo("{}");
        assertThat(res.gridVisible()).isTrue();
        assertThat(res.fogEnabled()).isFalse();
        assertThat(res.published()).isFalse();
        assertThat(res.imageUrl()).isNull();
        assertThat(res.mine()).isTrue();
        assertThat(res.authorName()).isEqualTo("gm");
    }

    @Test @DisplayName("create() keeps an uploaded background of the caller")
    void createWithImage() {
        UUID image = UUID.randomUUID();
        when(maps.countByOwnerId(userId)).thenReturn(0L);
        when(users.findById(userId)).thenReturn(Optional.of(me));
        when(images.existsByIdAndOwnerId(image, userId)).thenReturn(true);
        saveReturnsArgument();

        MapResponse res = service.create(userId, request(image, "{\"fog\":[1]}"));

        assertThat(res.imageUrl()).isEqualTo("/images/" + image);
        assertThat(res.layers()).isEqualTo("{\"fog\":[1]}");
    }

    @Test @DisplayName("create() refuses a background the caller did not upload")
    void createForeignImage() {
        UUID image = UUID.randomUUID();
        when(maps.countByOwnerId(userId)).thenReturn(0L);
        when(users.findById(userId)).thenReturn(Optional.of(me));
        when(images.existsByIdAndOwnerId(image, userId)).thenReturn(false);

        assertThatThrownBy(() -> service.create(userId, request(image, null)))
                .isInstanceOf(InvalidMapException.class);
        verify(maps, never()).save(any());
    }

    @Test @DisplayName("create() refuses layers that are not a JSON object, not JSON or too large")
    void createBadLayers() {
        when(maps.countByOwnerId(userId)).thenReturn(0L);
        when(users.findById(userId)).thenReturn(Optional.of(me));

        assertThatThrownBy(() -> service.create(userId, request(null, "[1,2]"))).isInstanceOf(InvalidMapException.class);
        assertThatThrownBy(() -> service.create(userId, request(null, "{oops"))).isInstanceOf(InvalidMapException.class);
        String huge = "{\"x\":\"" + "a".repeat(MapService.MAX_LAYERS_CHARS) + "\"}";
        assertThatThrownBy(() -> service.create(userId, request(null, huge))).isInstanceOf(InvalidMapException.class);
        verify(maps, never()).save(any());
    }

    @Test @DisplayName("create() stops at the per-user limit")
    void createLimit() {
        when(maps.countByOwnerId(userId)).thenReturn(2L);

        assertThatThrownBy(() -> service.create(userId, request(null, null)))
                .isInstanceOf(ConflictException.class);
        verify(maps, never()).save(any());
    }

    // ── read ────────────────────────────────────────────────────────────────

    @Test @DisplayName("get() returns an own map even when it is not published")
    void getOwn() {
        GameMap m = map(me, null, false);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));

        assertThat(service.get(m.getId(), userId).mine()).isTrue();
    }

    @Test @DisplayName("get() returns a published map of someone else")
    void getPublished() {
        GameMap m = map(other, null, true);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));

        MapResponse res = service.get(m.getId(), userId);

        assertThat(res.mine()).isFalse();
        assertThat(res.authorName()).isEqualTo("autor");
    }

    @Test @DisplayName("get() hides an unpublished map of someone else as not found")
    void getHidden() {
        GameMap m = map(other, null, false);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));

        assertThatThrownBy(() -> service.get(m.getId(), userId)).isInstanceOf(NotFoundException.class);
    }

    @Test @DisplayName("mine() lists the caller's maps")
    void mineLists() {
        when(maps.findMine(userId)).thenReturn(List.of(map(me, null, false), map(me, null, true)));

        assertThat(service.mine(userId)).hasSize(2);
    }

    // ── update / delete ─────────────────────────────────────────────────────

    @Test @DisplayName("update() is for the author only")
    void updateForbidden() {
        GameMap m = map(other, null, true);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));

        assertThatThrownBy(() -> service.update(m.getId(), userId, request(null, null)))
                .isInstanceOf(ForbiddenException.class);
        verify(maps, never()).save(any());
    }

    @Test @DisplayName("update() replacing the background deletes the old one when no map uses it any more")
    void updateReplacesImage() {
        UUID oldImage = UUID.randomUUID();
        UUID newImage = UUID.randomUUID();
        GameMap m = map(me, oldImage, false);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));
        when(images.existsByIdAndOwnerId(newImage, userId)).thenReturn(true);
        saveReturnsArgument();
        when(maps.existsByImageId(oldImage)).thenReturn(false);

        MapResponse res = service.update(m.getId(), userId, request(newImage, "{}"));

        assertThat(res.imageUrl()).isEqualTo("/images/" + newImage);
        verify(images).deleteOwned(oldImage, userId);
    }

    @Test @DisplayName("update() keeps the old background when a copy still uses it")
    void updateKeepsSharedImage() {
        UUID oldImage = UUID.randomUUID();
        GameMap m = map(me, oldImage, false);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));
        saveReturnsArgument();
        when(maps.existsByImageId(oldImage)).thenReturn(true);

        service.update(m.getId(), userId, request(null, null));

        verify(images, never()).deleteOwned(any(), any());
    }

    @Test @DisplayName("update() with the same background does not touch the uploads")
    void updateSameImage() {
        UUID image = UUID.randomUUID();
        GameMap m = map(me, image, false);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));
        saveReturnsArgument();

        MapResponse res = service.update(m.getId(), userId, request(image, "{\"fog\":[3]}"));

        assertThat(res.layers()).isEqualTo("{\"fog\":[3]}");
        verify(images, never()).existsByIdAndOwnerId(any(), any());
        verify(images, never()).deleteOwned(any(), any());
    }

    @Test @DisplayName("delete() removes the map and its unused background")
    void deleteRemoves() {
        UUID image = UUID.randomUUID();
        GameMap m = map(me, image, false);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));
        when(maps.existsByImageId(image)).thenReturn(false);

        service.delete(m.getId(), userId);

        verify(maps).delete(m);
        verify(images).deleteOwned(image, userId);
    }

    @Test @DisplayName("delete() keeps a background that another map still uses")
    void deleteKeepsSharedImage() {
        UUID image = UUID.randomUUID();
        GameMap m = map(me, image, false);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));
        when(maps.existsByImageId(image)).thenReturn(true);

        service.delete(m.getId(), userId);

        verify(maps).delete(m);
        verify(images, never()).deleteOwned(any(), any());
    }

    @Test @DisplayName("delete() is for the author only")
    void deleteForbidden() {
        GameMap m = map(other, null, true);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));

        assertThatThrownBy(() -> service.delete(m.getId(), userId)).isInstanceOf(ForbiddenException.class);
        verify(maps, never()).delete(any(GameMap.class));
    }

    // ── publish / community / copy ──────────────────────────────────────────

    @Test @DisplayName("setPublished(true) stamps the publication time; false clears it")
    void publishToggles() {
        GameMap m = map(me, null, false);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));
        saveReturnsArgument();

        MapResponse on = service.setPublished(m.getId(), userId, true);
        assertThat(on.published()).isTrue();
        assertThat(m.getPublishedAt()).isNotNull();

        MapResponse off = service.setPublished(m.getId(), userId, false);
        assertThat(off.published()).isFalse();
        assertThat(m.getPublishedAt()).isNull();
    }

    @Test @DisplayName("setPublished() is for the author only")
    void publishForbidden() {
        GameMap m = map(other, null, true);
        when(maps.findById(m.getId())).thenReturn(Optional.of(m));

        assertThatThrownBy(() -> service.setPublished(m.getId(), userId, false)).isInstanceOf(ForbiddenException.class);
    }

    @Test @DisplayName("community() without filters searches every published map")
    void communityAll() {
        when(maps.searchPublished(eq(""), any(Pageable.class))).thenReturn(List.of(map(other, null, true)));

        List<MapResponse> res = service.community(userId, null, null);

        assertThat(res).hasSize(1);
        assertThat(res.get(0).mine()).isFalse();
    }

    @Test @DisplayName("community() strips LIKE wildcards and filters by kind")
    void communityFilters() {
        when(maps.searchPublishedByKind(eq(Kind.PIRATE), eq("cripta"), any(Pageable.class))).thenReturn(List.of());

        assertThat(service.community(userId, "  cr%ip_ta ", Kind.PIRATE)).isEmpty();
        verify(maps, never()).searchPublished(any(), any());
    }

    @Test @DisplayName("copy() duplicates a published map as an unpublished one of the caller")
    void copyPublished() {
        UUID image = UUID.randomUUID();
        GameMap source = map(other, image, true);
        when(maps.findById(source.getId())).thenReturn(Optional.of(source));
        when(maps.countByOwnerId(userId)).thenReturn(0L);
        when(users.findById(userId)).thenReturn(Optional.of(me));
        saveReturnsArgument();

        MapResponse res = service.copy(source.getId(), userId);

        ArgumentCaptor<GameMap> cap = ArgumentCaptor.forClass(GameMap.class);
        verify(maps).save(cap.capture());
        GameMap copy = cap.getValue();
        assertThat(copy.getOwner()).isSameAs(me);
        assertThat(copy.isPublished()).isFalse();
        assertThat(copy.getImageId()).isEqualTo(image);
        assertThat(copy.getLayers()).isEqualTo(source.getLayers());
        assertThat(res.name()).isEqualTo("Cripta (cópia)");
        assertThat(res.mine()).isTrue();
    }

    @Test @DisplayName("copy() cannot reach an unpublished map of someone else")
    void copyHidden() {
        GameMap source = map(other, null, false);
        when(maps.findById(source.getId())).thenReturn(Optional.of(source));

        assertThatThrownBy(() -> service.copy(source.getId(), userId)).isInstanceOf(NotFoundException.class);
        verify(maps, never()).save(any());
    }

    @Test @DisplayName("copy() respects the per-user limit")
    void copyLimit() {
        GameMap source = map(other, null, true);
        when(maps.findById(source.getId())).thenReturn(Optional.of(source));
        when(maps.countByOwnerId(userId)).thenReturn(2L);

        assertThatThrownBy(() -> service.copy(source.getId(), userId)).isInstanceOf(ConflictException.class);
    }

    @Test @DisplayName("copy() shortens a long name so the suffix still fits in 100 characters")
    void copyLongName() {
        GameMap source = map(other, null, true);
        source.setName("x".repeat(100));
        when(maps.findById(source.getId())).thenReturn(Optional.of(source));
        when(maps.countByOwnerId(userId)).thenReturn(0L);
        when(users.findById(userId)).thenReturn(Optional.of(me));
        saveReturnsArgument();

        MapResponse res = service.copy(source.getId(), userId);

        assertThat(res.name()).hasSize(100).endsWith(" (cópia)");
    }
}
