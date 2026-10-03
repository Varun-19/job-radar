CREATE TABLE notification_outbox (
 id text PRIMARY KEY,
 profile_id text NOT NULL REFERENCES search_profiles(id),
 kind text NOT NULL CHECK(kind IN ('daily','weekly')),
 period text NOT NULL,
 subject text NOT NULL,
 body text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz,
 lease_until timestamptz,
 error text,
 UNIQUE(profile_id,kind,period)
);
