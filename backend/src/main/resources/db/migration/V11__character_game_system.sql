-- Game system a character sheet belongs to ("D&D 5e", "Personalizado", ...).
--
-- Existing sheets are all D&D 5e. The column is free text (like game_tables.game_system),
-- so supporting a new system later needs no schema change.
ALTER TABLE characters
    ADD COLUMN game_system VARCHAR(50) NOT NULL DEFAULT 'D&D 5e';
