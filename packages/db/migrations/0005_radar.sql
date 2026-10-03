CREATE TABLE scan_schedules (
 board_id text PRIMARY KEY REFERENCES job_boards(id), enabled boolean NOT NULL DEFAULT false,
 interval_minutes integer NOT NULL DEFAULT 1440 CHECK (interval_minutes BETWEEN 30 AND 10080),
 next_run_at timestamptz NOT NULL DEFAULT now(),lease_until timestamptz,claim_token uuid
);
CREATE TABLE scan_runs (
 id uuid PRIMARY KEY,board_id text NOT NULL REFERENCES job_boards(id),status text NOT NULL,
 started_at timestamptz NOT NULL,finished_at timestamptz,message text NOT NULL DEFAULT '',
 count integer NOT NULL DEFAULT 0,new_count integer NOT NULL DEFAULT 0,changed_count integer NOT NULL DEFAULT 0
);
CREATE TABLE discovery_inbox (
 id text PRIMARY KEY,board_id text NOT NULL REFERENCES job_boards(id),posting_id text NOT NULL,
 posting jsonb NOT NULL,version integer NOT NULL,first_seen_at timestamptz NOT NULL,last_seen_at timestamptz NOT NULL,
 changed_at timestamptz NOT NULL,change text NOT NULL,UNIQUE(board_id,posting_id)
);
CREATE TABLE source_observations (
 id uuid PRIMARY KEY,inbox_id text NOT NULL REFERENCES discovery_inbox(id),version integer NOT NULL,
 posting jsonb NOT NULL,captured_at timestamptz NOT NULL,UNIQUE(inbox_id,version)
);
INSERT INTO scan_schedules(board_id) SELECT id FROM job_boards;
