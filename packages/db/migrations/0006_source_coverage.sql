-- Public board APIs and company-identifying descriptions verified on 2026-10-03.
INSERT INTO job_boards(id,data) VALUES
 ('ashby-sarvam','{"id":"ashby-sarvam","company":"Sarvam AI","provider":"ashby","token":"sarvam"}'::jsonb),
 ('ashby-harvey','{"id":"ashby-harvey","company":"Harvey","provider":"ashby","token":"harvey"}'::jsonb),
 ('ashby-furtherai','{"id":"ashby-furtherai","company":"FurtherAI","provider":"ashby","token":"FurtherAI"}'::jsonb),
 ('greenhouse-rubrik','{"id":"greenhouse-rubrik","company":"Rubrik","provider":"greenhouse","token":"rubrik"}'::jsonb),
 ('greenhouse-okta','{"id":"greenhouse-okta","company":"Okta","provider":"greenhouse","token":"okta"}'::jsonb),
 ('ashby-notion','{"id":"ashby-notion","company":"Notion","provider":"ashby","token":"notion"}'::jsonb),
 ('greenhouse-vercel','{"id":"greenhouse-vercel","company":"Vercel","provider":"greenhouse","token":"vercel"}'::jsonb),
 ('ashby-supabase','{"id":"ashby-supabase","company":"Supabase","provider":"ashby","token":"supabase"}'::jsonb),
 ('greenhouse-gitlab','{"id":"greenhouse-gitlab","company":"GitLab","provider":"greenhouse","token":"gitlab"}'::jsonb),
 ('greenhouse-elastic','{"id":"greenhouse-elastic","company":"Elastic","provider":"greenhouse","token":"elastic"}'::jsonb),
 ('greenhouse-adyen','{"id":"greenhouse-adyen","company":"Adyen","provider":"greenhouse","token":"adyen"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
