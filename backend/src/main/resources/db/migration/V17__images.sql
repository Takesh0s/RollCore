-- Uploaded images (table covers now, maps later), stored in the database so every
-- device sees the same picture and no external object storage is needed yet.
--
-- The id is a random UUID: GET /images/{id} is public (an <img> tag cannot send the
-- access token), so the unguessable id is what protects the picture.
CREATE TABLE images (
    id            UUID          NOT NULL DEFAULT gen_random_uuid(),
    owner_id      UUID          NOT NULL,
    content_type  VARCHAR(30)   NOT NULL,
    size_bytes    INT           NOT NULL,
    data          BYTEA         NOT NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT now(),

    CONSTRAINT pk_images              PRIMARY KEY (id),
    CONSTRAINT ck_images_content_type CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
    CONSTRAINT fk_images_owner        FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_images_owner ON images (owner_id);
