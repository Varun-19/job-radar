CREATE TABLE IF NOT EXISTS alert_dismissals (id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
