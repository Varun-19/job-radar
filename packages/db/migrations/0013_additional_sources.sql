INSERT INTO job_boards(id,data) VALUES
 ('lever-acceldata','{"id":"lever-acceldata","company":"Acceldata","provider":"lever","token":"acceldata"}'::jsonb),
 ('feed-wwr','{"id":"feed-wwr","company":"We Work Remotely","provider":"weworkremotely","token":"all"}'::jsonb)
ON CONFLICT DO NOTHING;
