CREATE TABLE evaluation_proposals (id text PRIMARY KEY,job_id text NOT NULL REFERENCES opportunity_drafts(id),data jsonb NOT NULL);
