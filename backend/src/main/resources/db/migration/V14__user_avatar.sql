-- Profile photo stored with the account so every device shows the same avatar.
-- Holds a small data URL (the web client downsizes to ~256px) or an https URL.
ALTER TABLE users ADD COLUMN avatar_url TEXT;
