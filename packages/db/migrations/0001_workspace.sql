CREATE TABLE workspace_meta (id integer PRIMARY KEY CHECK (id = 1), revision integer NOT NULL DEFAULT 0);
INSERT INTO workspace_meta (id,revision) VALUES (1,0);
CREATE TABLE search_profiles (id text PRIMARY KEY, config jsonb NOT NULL);
CREATE TABLE search_profile_versions (profile_id text NOT NULL REFERENCES search_profiles(id), version integer NOT NULL, config jsonb NOT NULL, PRIMARY KEY(profile_id,version));
CREATE TABLE opportunity_drafts (id text PRIMARY KEY, profile_id text NOT NULL REFERENCES search_profiles(id), data jsonb NOT NULL);
CREATE TABLE company_preferences (profile_id text NOT NULL REFERENCES search_profiles(id), company text NOT NULL, tier text NOT NULL CHECK(tier IN ('strategic-target','target','watch','opportunistic','excluded','unclassified')), PRIMARY KEY(profile_id,company));
CREATE TABLE workspace_activities (id uuid PRIMARY KEY,revision integer NOT NULL,type text NOT NULL,data jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
