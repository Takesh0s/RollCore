-- V3__spells_schema.sql — Sprint 8: Compêndio de Magias
CREATE TABLE spells (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    name           VARCHAR(150) NOT NULL,
    level          SMALLINT     NOT NULL CHECK (level BETWEEN 0 AND 9),
    school         VARCHAR(30)  NOT NULL,
    casting_time   VARCHAR(80)  NOT NULL,
    range          VARCHAR(80)  NOT NULL,
    components     VARCHAR(120) NOT NULL,
    duration       VARCHAR(80)  NOT NULL,
    description    TEXT         NOT NULL,
    higher_levels  TEXT,
    classes        TEXT[]       NOT NULL,
    ritual         BOOLEAN      NOT NULL DEFAULT FALSE,
    concentration  BOOLEAN      NOT NULL DEFAULT FALSE,
    attack_type    VARCHAR(20),
    damage_dice    VARCHAR(20),
    damage_type    VARCHAR(30),
    save_attribute VARCHAR(3),
    source         VARCHAR(60)  NOT NULL DEFAULT 'Livro do Jogador',
    CONSTRAINT pk_spells      PRIMARY KEY (id),
    CONSTRAINT uq_spells_name UNIQUE (name)
);
CREATE INDEX idx_spells_level   ON spells (level);
CREATE INDEX idx_spells_classes ON spells USING GIN (classes);
CREATE INDEX idx_spells_name_fts ON spells USING GIN (to_tsvector('portuguese', name));

CREATE TABLE character_spells (
    character_id UUID     NOT NULL,
    spell_id     UUID     NOT NULL,
    is_prepared  BOOLEAN  NOT NULL DEFAULT TRUE,
    position     SMALLINT NOT NULL DEFAULT 0,
    added_at     TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT pk_character_spells PRIMARY KEY (character_id, spell_id),
    CONSTRAINT fk_cs_character     FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_spell         FOREIGN KEY (spell_id)     REFERENCES spells (id)     ON DELETE CASCADE
);
CREATE INDEX idx_cs_character_id ON character_spells (character_id);