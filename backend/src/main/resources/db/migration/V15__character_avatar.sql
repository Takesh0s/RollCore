-- Character portrait stored with the sheet so it shows on every device.
-- Holds a small data URL (the web client downsizes to ~256px) or an https URL.
ALTER TABLE characters ADD COLUMN avatar_url TEXT;
