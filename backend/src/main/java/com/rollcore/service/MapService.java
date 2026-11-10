package com.rollcore.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollcore.dto.request.MapRequest;
import com.rollcore.dto.response.MapResponse;
import com.rollcore.entity.GameMap;
import com.rollcore.entity.GameMap.Kind;
import com.rollcore.entity.User;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.InvalidMapException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.GameMapRepository;
import com.rollcore.repository.StoredImageRepository;
import com.rollcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Battle maps: the caller's library, saving, publishing to the community workshop and copying.
 *
 * <p>Pictures are uploaded through {@link ImageService}. A map may only use a picture its owner
 * uploaded; a copy keeps pointing at the original's picture, and a picture is deleted together
 * with the last map that uses it (and only by the user who uploaded it).
 */
@Service
public class MapService {

    /** Upper bound for the layers JSON (a full 100 x 100 map painted with one terrain is ~60 KB). */
    static final int MAX_LAYERS_CHARS = 200_000;
    static final int COMMUNITY_PAGE   = 40;

    private final GameMapRepository     maps;
    private final UserRepository        users;
    private final StoredImageRepository images;
    private final ObjectMapper          json;
    private final int                   maxPerUser;

    public MapService(GameMapRepository maps,
                      UserRepository users,
                      StoredImageRepository images,
                      ObjectMapper json,
                      @Value("${rollcore.maps.max-per-user:30}") int maxPerUser) {
        this.maps = maps;
        this.users = users;
        this.images = images;
        this.json = json;
        this.maxPerUser = maxPerUser;
    }

    @Transactional(readOnly = true)
    public List<MapResponse> mine(UUID userId) {
        return maps.findMine(userId).stream().map(m -> MapResponse.of(m, userId)).toList();
    }

    @Transactional
    public MapResponse create(UUID userId, MapRequest req) {
        requireRoom(userId);
        User owner = users.findById(userId).orElseThrow(() -> new NotFoundException("User not found."));
        GameMap map = GameMap.builder().owner(owner).build();
        apply(map, req, userId);
        return MapResponse.of(maps.save(map), userId);
    }

    /** Own maps, and published maps of anyone; anything else looks like it does not exist. */
    @Transactional(readOnly = true)
    public MapResponse get(UUID id, UUID userId) {
        return MapResponse.of(visible(id, userId), userId);
    }

    @Transactional
    public MapResponse update(UUID id, UUID userId, MapRequest req) {
        GameMap map = owned(id, userId);
        UUID oldImage = map.getImageId();
        apply(map, req, userId);
        GameMap saved = maps.save(map);
        if (oldImage != null && !oldImage.equals(saved.getImageId())) cleanupImage(oldImage, userId);
        return MapResponse.of(saved, userId);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        GameMap map = owned(id, userId);
        UUID image = map.getImageId();
        maps.delete(map);
        cleanupImage(image, userId);
    }

    @Transactional
    public MapResponse setPublished(UUID id, UUID userId, boolean published) {
        GameMap map = owned(id, userId);
        if (map.isPublished() != published) {
            map.setPublished(published);
            map.setPublishedAt(published ? Instant.now() : null);
        }
        return MapResponse.of(maps.save(map), userId);
    }

    /** Community workshop: published maps, newest first; {@code q} matches the name, {@code kind} filters. */
    @Transactional(readOnly = true)
    public List<MapResponse> community(UUID userId, String q, Kind kind) {
        String term = q == null ? "" : q.trim().replace("%", "").replace("_", "");
        PageRequest page = PageRequest.of(0, COMMUNITY_PAGE);
        List<GameMap> found = kind == null
                ? maps.searchPublished(term, page)
                : maps.searchPublishedByKind(kind, term, page);
        return found.stream().map(m -> MapResponse.of(m, userId)).toList();
    }

    /** Copies an own or published map into the caller's library (unpublished, same background picture). */
    @Transactional
    public MapResponse copy(UUID id, UUID userId) {
        GameMap source = visible(id, userId);
        requireRoom(userId);
        User owner = users.findById(userId).orElseThrow(() -> new NotFoundException("User not found."));
        String suffix = " (cópia)";
        String name = source.getName().length() + suffix.length() > 100
                ? source.getName().substring(0, 100 - suffix.length()) + suffix
                : source.getName() + suffix;
        GameMap copy = GameMap.builder()
                .owner(owner).name(name)
                .kind(source.getKind()).gridType(source.getGridType())
                .cols(source.getCols()).rows(source.getRows()).cellSize(source.getCellSize())
                .imageId(source.getImageId()).layers(source.getLayers())
                .gridVisible(source.isGridVisible()).fogEnabled(source.isFogEnabled())
                .build();
        return MapResponse.of(maps.save(copy), userId);
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private GameMap visible(UUID id, UUID userId) {
        GameMap map = maps.findById(id).orElseThrow(() -> new NotFoundException("Map not found."));
        if (!map.isPublished() && !map.getOwner().getId().equals(userId)) {
            throw new NotFoundException("Map not found.");
        }
        return map;
    }

    private GameMap owned(UUID id, UUID userId) {
        GameMap map = maps.findById(id).orElseThrow(() -> new NotFoundException("Map not found."));
        if (!map.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("Only the author can change this map.");
        }
        return map;
    }

    private void requireRoom(UUID userId) {
        if (maps.countByOwnerId(userId) >= maxPerUser) {
            throw new ConflictException("Map limit reached (" + maxPerUser + "). Delete a map to create another.");
        }
    }

    private void apply(GameMap map, MapRequest req, UUID userId) {
        map.setName(req.name().trim());
        map.setKind(req.kind());
        map.setGridType(req.gridType());
        map.setCols(req.cols());
        map.setRows(req.rows());
        map.setCellSize(req.cellSize());
        map.setImageId(resolveImage(req.imageId(), map.getImageId(), userId));
        map.setLayers(checkLayers(req.layers()));
        map.setGridVisible(req.gridVisible() == null || req.gridVisible());
        map.setFogEnabled(Boolean.TRUE.equals(req.fogEnabled()));
    }

    /** Keeps the current picture, or accepts one the caller uploaded. */
    private UUID resolveImage(UUID requested, UUID current, UUID userId) {
        if (requested == null || requested.equals(current)) return requested;
        if (!images.existsByIdAndOwnerId(requested, userId)) {
            throw new InvalidMapException("The background image was not found among your uploads.");
        }
        return requested;
    }

    private String checkLayers(String layers) {
        if (layers == null || layers.isBlank()) return "{}";
        if (layers.length() > MAX_LAYERS_CHARS) throw new InvalidMapException("The map painting is too large.");
        try {
            JsonNode node = json.readTree(layers);
            if (node == null || !node.isObject()) throw new InvalidMapException("The map layers must be a JSON object.");
        } catch (JsonProcessingException e) {
            throw new InvalidMapException("The map layers are not valid JSON.");
        }
        return layers;
    }

    /** Deletes a no-longer-used background picture, but only if {@code userId} uploaded it. */
    private void cleanupImage(UUID imageId, UUID userId) {
        if (imageId == null || maps.existsByImageId(imageId)) return;
        images.deleteOwned(imageId, userId);
    }
}
