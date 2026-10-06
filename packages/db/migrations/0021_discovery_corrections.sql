-- OpenFX's public board is linked from its verified Bengaluru frontend vacancy.
INSERT INTO job_boards(id,data) VALUES
 ('greenhouse-openfx','{"id":"greenhouse-openfx","company":"OpenFX","provider":"greenhouse","token":"openfx"}'::jsonb)
ON CONFLICT DO NOTHING;
INSERT INTO scan_schedules(board_id) VALUES ('greenhouse-openfx') ON CONFLICT DO NOTHING;
-- Full Oracle details require one request per vacancy. Keep the shipped source within a keyword scope;
-- the adapter now follows total/offset pagination and fails incomplete scans instead of reporting success.
-- Preserve any query already configured by the user.
UPDATE job_boards SET data=data||'{"searchText":"frontend"}'::jsonb
WHERE id='oracle-oracle' AND data->>'provider'='oracle' AND NOT data ? 'searchText';
