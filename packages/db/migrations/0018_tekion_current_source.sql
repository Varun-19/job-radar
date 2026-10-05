-- Current Ashby token verified from the official careers script, 5 October 2026. Historical Greenhouse token returned 404.
INSERT INTO job_boards(id,data) VALUES ('ashby-tekion','{"id":"ashby-tekion","company":"Tekion","provider":"ashby","token":"tekion"}'::jsonb) ON CONFLICT DO NOTHING;
