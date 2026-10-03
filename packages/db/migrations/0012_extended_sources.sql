INSERT INTO job_boards(id,data) VALUES
 ('workday-adobe','{"id":"workday-adobe","company":"Adobe","provider":"workday","token":"adobe/wd5/external_experienced","searchText":"frontend"}'::jsonb),
 ('oracle-oracle','{"id":"oracle-oracle","company":"Oracle","provider":"oracle","token":"eeho.fa.us2.oraclecloud.com/CX_1"}'::jsonb),
 ('feed-remoteok','{"id":"feed-remoteok","company":"Remote OK","provider":"remoteok","token":"all"}'::jsonb),
 ('feed-remotive','{"id":"feed-remotive","company":"Remotive","provider":"remotive","token":"all"}'::jsonb),
 ('feed-arbeitnow','{"id":"feed-arbeitnow","company":"Arbeitnow","provider":"arbeitnow","token":"all"}'::jsonb)
ON CONFLICT DO NOTHING;
