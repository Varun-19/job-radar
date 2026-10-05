-- Public sources verified 5 October 2026. Mistral token linked from official careers page; Rippling details identify employer and official board URL.
INSERT INTO job_boards(id,data) VALUES
 ('ashby-mistral','{"id":"ashby-mistral","company":"Mistral AI","provider":"ashby","token":"mistral.ai"}'::jsonb),
 ('rippling-rippling','{"id":"rippling-rippling","company":"Rippling","provider":"rippling","token":"rippling"}'::jsonb)
ON CONFLICT DO NOTHING;
