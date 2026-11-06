-- Inventory of a character sheet: items and coins.
--
-- character_items  one row per item stack; deleted with the character.
--                  weight is per unit, in kg; the sheet multiplies it by quantity.
-- characters.coins_*  platinum / gold / silver / copper pieces.
CREATE TABLE character_items (
    id           UUID PRIMARY KEY,
    character_id UUID          NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
    name         VARCHAR(80)   NOT NULL,
    category     VARCHAR(12)   NOT NULL DEFAULT 'other',
    quantity     INT           NOT NULL DEFAULT 1,
    weight       NUMERIC(7, 2) NOT NULL DEFAULT 0,
    damage       VARCHAR(40),
    description  VARCHAR(500),
    created_at   TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT chk_character_items_category CHECK (category IN ('weapon', 'armor', 'consumable', 'other')),
    CONSTRAINT chk_character_items_quantity CHECK (quantity BETWEEN 0 AND 9999),
    CONSTRAINT chk_character_items_weight   CHECK (weight >= 0)
);

CREATE INDEX idx_character_items_character ON character_items (character_id, created_at);

ALTER TABLE characters
    ADD COLUMN coins_pp INT NOT NULL DEFAULT 0,
    ADD COLUMN coins_gp INT NOT NULL DEFAULT 0,
    ADD COLUMN coins_sp INT NOT NULL DEFAULT 0,
    ADD COLUMN coins_cp INT NOT NULL DEFAULT 0;
