-- Dados screen: a reason for each roll, advantage/disadvantage and saved shortcuts.
--
-- label            free text shown next to the result (e.g. "Ataque com espada longa").
-- mode             normal | advantage | disadvantage. For advantage/disadvantage the dice are
--                  rolled twice; individual_results/total keep the chosen set and
--                  discarded_results keeps the other one so the history can show both.
-- dice_shortcuts   per-user saved formulas ("Atalhos salvos").
ALTER TABLE dice_rolls
    ADD COLUMN label             VARCHAR(80),
    ADD COLUMN mode              VARCHAR(12) NOT NULL DEFAULT 'normal',
    ADD COLUMN discarded_results JSONB;

ALTER TABLE dice_rolls
    ADD CONSTRAINT chk_dice_rolls_mode CHECK (mode IN ('normal', 'advantage', 'disadvantage'));

CREATE INDEX idx_dice_rolls_user_table ON dice_rolls (user_id, game_table_id, rolled_at DESC);

CREATE TABLE dice_shortcuts (
    id         UUID PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name       VARCHAR(40) NOT NULL,
    formula    VARCHAR(50) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_dice_shortcuts_user ON dice_shortcuts (user_id, created_at);
