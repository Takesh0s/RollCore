-- Calendar: scheduled events of a game table and the members' RSVP answers.
--
-- All members of the table are implicitly invited; a member with no row in
-- table_event_rsvps is "pending". Date and times are the table's wall-clock values
-- (no time zone), exactly what the creator typed.
CREATE TABLE table_events (
    id             UUID          NOT NULL DEFAULT gen_random_uuid(),
    game_table_id  UUID          NOT NULL,
    created_by     UUID          NOT NULL,
    title          VARCHAR(100)  NOT NULL,
    description    VARCHAR(2000),
    event_date     DATE          NOT NULL,
    start_time     TIME          NOT NULL,
    end_time       TIME          NOT NULL,
    repeat_rule    VARCHAR(20)   NOT NULL DEFAULT 'NONE',
    color          VARCHAR(20)   NOT NULL DEFAULT 'BLUE',
    ask_rsvp       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP     NOT NULL DEFAULT now(),

    CONSTRAINT pk_table_events        PRIMARY KEY (id),
    CONSTRAINT ck_table_events_time   CHECK (end_time > start_time),
    CONSTRAINT ck_table_events_repeat CHECK (repeat_rule IN ('NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY')),
    CONSTRAINT ck_table_events_color  CHECK (color IN ('RED', 'BLUE', 'GREEN', 'AMBER', 'TEAL', 'PURPLE')),
    CONSTRAINT fk_table_events_table  FOREIGN KEY (game_table_id) REFERENCES game_tables (id) ON DELETE CASCADE,
    CONSTRAINT fk_table_events_user   FOREIGN KEY (created_by)    REFERENCES users (id)       ON DELETE CASCADE
);

CREATE INDEX idx_table_events_table_date ON table_events (game_table_id, event_date);

CREATE TABLE table_event_rsvps (
    id            UUID         NOT NULL DEFAULT gen_random_uuid(),
    event_id      UUID         NOT NULL,
    user_id       UUID         NOT NULL,
    status        VARCHAR(10)  NOT NULL,
    responded_at  TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT pk_table_event_rsvps        PRIMARY KEY (id),
    CONSTRAINT uq_table_event_rsvps        UNIQUE (event_id, user_id),
    CONSTRAINT ck_table_event_rsvps_status CHECK (status IN ('YES', 'MAYBE', 'NO')),
    CONSTRAINT fk_rsvps_event              FOREIGN KEY (event_id) REFERENCES table_events (id) ON DELETE CASCADE,
    CONSTRAINT fk_rsvps_user               FOREIGN KEY (user_id)  REFERENCES users (id)        ON DELETE CASCADE
);
