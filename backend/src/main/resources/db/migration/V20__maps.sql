-- Battle maps (GM tools).
--
-- A map is a grid (square or hex) of cols x rows cells, each cell cell_size pixels wide in
-- the editor. The background is an optional uploaded picture (images, V17) and everything the
-- user paints (terrain, revealed fog) lives in `layers`, a JSON document the clients own:
--   {"cells": {"<terrain id>": [cell index, ...]}, "fog": [revealed cell index, ...]}
-- where cell index = row * cols + col. The server only checks that it is a JSON object of
-- bounded size.
--
-- Published maps appear in the community workshop and can be copied by anyone. A copy shares
-- the background picture of the original, so `image_id` is not unique.
CREATE TABLE game_maps (
    id            UUID          NOT NULL DEFAULT gen_random_uuid(),
    owner_id      UUID          NOT NULL,
    name          VARCHAR(100)  NOT NULL,
    kind          VARCHAR(20)   NOT NULL,
    grid_type     VARCHAR(10)   NOT NULL,
    grid_cols     INT           NOT NULL,
    grid_rows     INT           NOT NULL,
    cell_size     INT           NOT NULL,
    image_id      UUID,
    layers        TEXT          NOT NULL DEFAULT '{}',
    grid_visible  BOOLEAN       NOT NULL DEFAULT TRUE,
    fog_enabled   BOOLEAN       NOT NULL DEFAULT FALSE,
    published     BOOLEAN       NOT NULL DEFAULT FALSE,
    published_at  TIMESTAMP,
    created_at    TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT now(),

    CONSTRAINT pk_game_maps      PRIMARY KEY (id),
    CONSTRAINT ck_game_maps_kind CHECK (kind IN (
        'MEDIEVAL', 'STEAMPUNK', 'CYBERPUNK', 'WESTERN', 'PIRATE', 'MODERN')),
    CONSTRAINT ck_game_maps_grid CHECK (grid_type IN ('SQUARE', 'HEX')),
    CONSTRAINT ck_game_maps_size CHECK (
        grid_cols BETWEEN 5 AND 100 AND grid_rows BETWEEN 5 AND 100 AND cell_size BETWEEN 16 AND 128),
    CONSTRAINT fk_game_maps_owner FOREIGN KEY (owner_id) REFERENCES users (id)  ON DELETE CASCADE,
    CONSTRAINT fk_game_maps_image FOREIGN KEY (image_id) REFERENCES images (id) ON DELETE SET NULL
);

CREATE INDEX idx_game_maps_owner     ON game_maps (owner_id, updated_at DESC);
CREATE INDEX idx_game_maps_image     ON game_maps (image_id) WHERE image_id IS NOT NULL;
CREATE INDEX idx_game_maps_published ON game_maps (published_at DESC) WHERE published;
