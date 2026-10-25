-- Fase 2a: game tables ("mesas") and their members.
--
-- A game table is the persistent campaign room users create, join by invite code
-- and manage (Figma: Criação/Edição de Mesa, Ingressar Mesa, Perfil da Mesa).
-- It is distinct from the `sessions` scaffold (V1), which will model a live
-- play session (WebSocket) inside a table in Fase 2b.
CREATE TABLE game_tables (
    id           UUID          NOT NULL DEFAULT gen_random_uuid(),
    owner_id     UUID          NOT NULL,
    name         VARCHAR(100)  NOT NULL,
    game_system  VARCHAR(50)   NOT NULL DEFAULT 'D&D 5e',
    description  VARCHAR(2000),
    max_players  INT           NOT NULL DEFAULT 5,
    cover_url    VARCHAR(500),
    invite_code  VARCHAR(10)   NOT NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP     NOT NULL DEFAULT now(),

    CONSTRAINT pk_game_tables             PRIMARY KEY (id),
    CONSTRAINT uq_game_tables_invite_code UNIQUE (invite_code),
    CONSTRAINT ck_game_tables_max_players CHECK (max_players BETWEEN 1 AND 20),
    CONSTRAINT fk_game_tables_owner       FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_game_tables_owner ON game_tables (owner_id);

CREATE TABLE game_table_members (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    game_table_id  UUID         NOT NULL,
    user_id        UUID         NOT NULL,
    role           VARCHAR(20)  NOT NULL,
    display_name   VARCHAR(50),
    avatar_url     VARCHAR(500),
    muted          BOOLEAN      NOT NULL DEFAULT FALSE,
    joined_at      TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT pk_game_table_members       PRIMARY KEY (id),
    CONSTRAINT uq_game_table_members       UNIQUE (game_table_id, user_id),
    CONSTRAINT ck_game_table_members_role  CHECK (role IN ('MASTER', 'MODERATOR', 'PLAYER')),
    CONSTRAINT fk_gtm_game_table           FOREIGN KEY (game_table_id) REFERENCES game_tables (id) ON DELETE CASCADE,
    CONSTRAINT fk_gtm_user                 FOREIGN KEY (user_id)       REFERENCES users (id)       ON DELETE CASCADE
);

CREATE INDEX idx_gtm_user ON game_table_members (user_id);

CREATE TRIGGER trg_game_tables_updated_at
    BEFORE UPDATE ON game_tables
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
