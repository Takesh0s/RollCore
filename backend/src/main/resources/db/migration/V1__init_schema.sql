-- ─────────────────────────────────────────────────────────────────────────────
-- V1__init_schema.sql
-- RollCore – Fase 1 MVP
-- Mirrors the Logical Data Model in Arquitetura §6.4 and Doc. de Visão §9.2
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── users ─────────────────────────────────────────────────────────────────────
-- UC-01 / Arquitetura §6.4 – authentication and user identity
CREATE TABLE users (
    id            UUID         NOT NULL DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL,
    username      VARCHAR(20)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT pk_users          PRIMARY KEY (id),
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT uq_users_username UNIQUE (username)
);

CREATE INDEX idx_users_email ON users (email);

-- ── characters ────────────────────────────────────────────────────────────────
-- UC-02 / Arquitetura §6.4
-- attributes and spell_slots stored as JSONB for extensibility (Fase 3 / §6.3)
CREATE TABLE characters (
    id            UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL,
    name          VARCHAR(100) NOT NULL,
    class         VARCHAR(50)  NOT NULL,
    subclass      VARCHAR(100) NOT NULL DEFAULT '',
    race          VARCHAR(50)  NOT NULL,
    level         SMALLINT     NOT NULL CHECK (level BETWEEN 1 AND 20),
    attributes    JSONB        NOT NULL DEFAULT '{}',
    hp            INT          NOT NULL DEFAULT 0,
    max_hp        INT          NOT NULL DEFAULT 0,
    temp_hp       INT          NOT NULL DEFAULT 0,
    ac            INT          NOT NULL DEFAULT 10,
    spell_slots   JSONB,
    warlock_slots JSONB,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT pk_characters         PRIMARY KEY (id),
    CONSTRAINT fk_characters_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_characters_user_id  ON characters (user_id);
-- GIN index for JSONB attribute queries – Arquitetura §6.3
CREATE INDEX idx_characters_attributes ON characters USING GIN (attributes);

-- ── sessions ──────────────────────────────────────────────────────────────────
-- Scaffold for Fase 2 (UC-04 – WebSocket / STOMP sessions)
-- Created now so dice_rolls.session_id FK is valid from day 1
CREATE TABLE sessions (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    code           VARCHAR(10)  NOT NULL,
    master_user_id UUID         NOT NULL,
    name           VARCHAR(100) NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE', 'CLOSED')),
    created_at     TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT pk_sessions        PRIMARY KEY (id),
    CONSTRAINT uq_sessions_code   UNIQUE (code),
    CONSTRAINT fk_sessions_master FOREIGN KEY (master_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_code   ON sessions (code);
CREATE INDEX idx_sessions_master ON sessions (master_user_id);

-- ── dice_rolls ────────────────────────────────────────────────────────────────
-- UC-03 RN-02 / Arquitetura §6.4
-- session_id nullable: NULL = out-of-session roll (UC-03 RN-02)
CREATE TABLE dice_rolls (
    id                 UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL,
    session_id         UUID,
    formula            VARCHAR(50) NOT NULL,
    individual_results JSONB       NOT NULL DEFAULT '[]',
    total              INT         NOT NULL,
    rolled_at          TIMESTAMP   NOT NULL DEFAULT now(),

    CONSTRAINT pk_dice_rolls         PRIMARY KEY (id),
    CONSTRAINT fk_dice_rolls_user    FOREIGN KEY (user_id)    REFERENCES users    (id) ON DELETE CASCADE,
    CONSTRAINT fk_dice_rolls_session FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE SET NULL
);

CREATE INDEX idx_dice_rolls_user_id   ON dice_rolls (user_id);
CREATE INDEX idx_dice_rolls_rolled_at ON dice_rolls (rolled_at DESC);

-- ── updated_at auto-maintenance ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
