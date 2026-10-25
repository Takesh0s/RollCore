-- Google sign-in: link an account to the stable Google subject id ("sub" claim).
--
-- Accounts created through Google get an unusable random password hash, so
-- password_hash keeps its NOT NULL constraint. Multiple NULLs are allowed by the
-- UNIQUE constraint, which covers every account that signs in with a password.
ALTER TABLE users
    ADD COLUMN google_sub VARCHAR(64),
    ADD CONSTRAINT uq_users_google_sub UNIQUE (google_sub);
