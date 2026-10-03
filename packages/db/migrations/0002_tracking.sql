CREATE TABLE resume_versions (
 id text PRIMARY KEY, series_key text NOT NULL, version integer NOT NULL,
 metadata jsonb NOT NULL, original_base64 text NOT NULL,
 UNIQUE(series_key,version)
);
CREATE TABLE candidate_evidence (
 id text PRIMARY KEY, resume_version_id text REFERENCES resume_versions(id), data jsonb NOT NULL
);
CREATE TABLE applications (
 id text PRIMARY KEY, job_id text NOT NULL UNIQUE REFERENCES opportunity_drafts(id),
 resume_version_id text REFERENCES resume_versions(id), data jsonb NOT NULL
);
