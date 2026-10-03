CREATE TABLE IF NOT EXISTS recruiter_contacts (id text PRIMARY KEY, data jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS outreach_records (id text PRIMARY KEY, contact_id text NOT NULL REFERENCES recruiter_contacts(id), job_id text REFERENCES opportunity_drafts(id), data jsonb NOT NULL);
