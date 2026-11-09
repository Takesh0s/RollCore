-- In-app notifications.
--
-- One row per recipient. The text is built by the clients from `type` and the snapshot
-- columns (actor / table name / detail), so the rows keep making sense after the table or
-- the actor is gone: `table_id` has no foreign key on purpose (it is null when the table
-- no longer exists or the recipient lost access to it).
CREATE TABLE notifications (
    id          UUID          NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL,
    type        VARCHAR(30)   NOT NULL,
    table_id    UUID,
    table_name  VARCHAR(100),
    actor_name  VARCHAR(50),
    detail      VARCHAR(200),
    read_at     TIMESTAMP,
    created_at  TIMESTAMP     NOT NULL DEFAULT now(),

    CONSTRAINT pk_notifications      PRIMARY KEY (id),
    CONSTRAINT ck_notifications_type CHECK (type IN (
        'MEMBER_JOINED', 'MEMBER_LEFT', 'ROLE_CHANGED', 'REMOVED_FROM_TABLE',
        'HOST_TRANSFERRED', 'TABLE_DELETED', 'EVENT_CREATED')),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread  ON notifications (user_id) WHERE read_at IS NULL;
