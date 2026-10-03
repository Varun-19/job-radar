CREATE TABLE posting_revisions (
 id uuid NOT NULL UNIQUE,
 job_id text NOT NULL REFERENCES opportunity_drafts(id),
 version integer NOT NULL,
 data jsonb NOT NULL,
 PRIMARY KEY (job_id,version)
);
-- Preserve the initial observation for already imported postings.
INSERT INTO posting_revisions (id,job_id,version,data)
SELECT revision_id,id,1,jsonb_build_object('id',revision_id,'jobId',id,'version',1,'capturedAt',data->'source'->>'fetchedAt','snapshot',data)
FROM (SELECT gen_random_uuid() AS revision_id,id,data FROM opportunity_drafts WHERE data->'source' IS NOT NULL) AS imported;
-- Company identities and public APIs verified on 2026-10-03.
INSERT INTO job_boards (id,data) VALUES
 ('greenhouse-cloudflare','{"id":"greenhouse-cloudflare","company":"Cloudflare","provider":"greenhouse","token":"cloudflare"}'::jsonb),
 ('greenhouse-databricks','{"id":"greenhouse-databricks","company":"Databricks","provider":"greenhouse","token":"databricks"}'::jsonb),
 ('greenhouse-figma','{"id":"greenhouse-figma","company":"Figma","provider":"greenhouse","token":"figma"}'::jsonb),
 ('greenhouse-mongodb','{"id":"greenhouse-mongodb","company":"MongoDB","provider":"greenhouse","token":"mongodb"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
