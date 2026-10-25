-- Live table sessions: rolls made inside a table are shared with its members.
--
-- game_table_id is NULL for solo rolls (the existing behaviour). The composite index
-- serves the "latest rolls of this table" query.
ALTER TABLE dice_rolls
    ADD COLUMN game_table_id UUID,
    ADD CONSTRAINT fk_dice_rolls_game_table FOREIGN KEY (game_table_id) REFERENCES game_tables (id) ON DELETE CASCADE;

CREATE INDEX idx_dice_rolls_game_table ON dice_rolls (game_table_id, rolled_at DESC);
