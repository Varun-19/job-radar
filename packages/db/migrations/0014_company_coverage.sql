-- Public endpoints verified 4 October 2026. SmartRecruiters coverage is query-limited.
INSERT INTO job_boards(id,data) VALUES
 ('greenhouse-airbnb','{"id":"greenhouse-airbnb","company":"Airbnb","provider":"greenhouse","token":"airbnb"}'::jsonb),
 ('greenhouse-stripe','{"id":"greenhouse-stripe","company":"Stripe","provider":"greenhouse","token":"stripe"}'::jsonb),
 ('greenhouse-dropbox','{"id":"greenhouse-dropbox","company":"Dropbox","provider":"greenhouse","token":"dropbox"}'::jsonb),
 ('greenhouse-anthropic','{"id":"greenhouse-anthropic","company":"Anthropic","provider":"greenhouse","token":"anthropic"}'::jsonb),
 ('greenhouse-coinbase','{"id":"greenhouse-coinbase","company":"Coinbase","provider":"greenhouse","token":"coinbase"}'::jsonb),
 ('ashby-cursor','{"id":"ashby-cursor","company":"Cursor","provider":"ashby","token":"cursor"}'::jsonb),
 ('ashby-cohere','{"id":"ashby-cohere","company":"Cohere","provider":"ashby","token":"cohere"}'::jsonb),
 ('ashby-cognition','{"id":"ashby-cognition","company":"Cognition","provider":"ashby","token":"cognition"}'::jsonb),
 ('ashby-perplexity','{"id":"ashby-perplexity","company":"Perplexity","provider":"ashby","token":"perplexity"}'::jsonb),
 ('ashby-replit','{"id":"ashby-replit","company":"Replit","provider":"ashby","token":"replit"}'::jsonb),
 ('greenhouse-imanage','{"id":"greenhouse-imanage","company":"iManage","provider":"greenhouse","token":"imanage"}'::jsonb),
 ('greenhouse-prophecysimpledatalabs','{"id":"greenhouse-prophecysimpledatalabs","company":"Prophecy","provider":"greenhouse","token":"prophecysimpledatalabs"}'::jsonb),
 ('greenhouse-chargepoint','{"id":"greenhouse-chargepoint","company":"ChargePoint","provider":"greenhouse","token":"chargepoint"}'::jsonb),
 ('greenhouse-instawork','{"id":"greenhouse-instawork","company":"Instawork","provider":"greenhouse","token":"instawork"}'::jsonb),
 ('lever-zeta','{"id":"lever-zeta","company":"Zeta","provider":"lever","token":"zeta"}'::jsonb),
 ('ashby-openai','{"id":"ashby-openai","company":"OpenAI","provider":"ashby","token":"openai"}'::jsonb),
 ('greenhouse-zscaler','{"id":"greenhouse-zscaler","company":"Zscaler","provider":"greenhouse","token":"zscaler"}'::jsonb),
 ('smartrecruiters-servicenow','{"id":"smartrecruiters-servicenow","company":"ServiceNow","provider":"smartrecruiters","token":"ServiceNow","searchText":"frontend"}'::jsonb),
 ('smartrecruiters-canva','{"id":"smartrecruiters-canva","company":"Canva","provider":"smartrecruiters","token":"Canva","searchText":"frontend"}'::jsonb)
ON CONFLICT DO NOTHING;
