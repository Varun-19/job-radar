ALTER TABLE discovery_inbox ADD COLUMN missing_count integer NOT NULL DEFAULT 0;
ALTER TABLE discovery_inbox ADD COLUMN last_missing_at timestamptz;
