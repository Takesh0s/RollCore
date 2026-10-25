-- Fase 2c: user plans and table sponsorship.
--
-- FREE users sponsor at most 1 table at a time; PREMIUM users sponsor as many as
-- they like and may hand the hosting (master role) of a sponsored table to
-- another member. The sponsor is the user whose plan pays for the table, so a
-- hosted table does not count against the host's own quota.
--
-- There is no payment flow yet: promote a user manually with
--   UPDATE users SET plan = 'PREMIUM' WHERE email = '...';
ALTER TABLE users
    ADD COLUMN plan VARCHAR(10) NOT NULL DEFAULT 'FREE',
    ADD CONSTRAINT ck_users_plan CHECK (plan IN ('FREE', 'PREMIUM'));

ALTER TABLE game_tables ADD COLUMN sponsor_id UUID;
UPDATE game_tables SET sponsor_id = owner_id;
ALTER TABLE game_tables
    ADD CONSTRAINT fk_game_tables_sponsor FOREIGN KEY (sponsor_id) REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX idx_game_tables_sponsor ON game_tables (sponsor_id);
