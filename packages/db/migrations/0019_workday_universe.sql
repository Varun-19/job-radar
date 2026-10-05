-- Public Workday boards verified 5 October 2026. Frontend-query coverage, not full employer inventories.
INSERT INTO job_boards(id,data) VALUES
 ('workday-nvidia','{"id":"workday-nvidia","company":"NVIDIA","provider":"workday","token":"nvidia/wd5/NVIDIAExternalCareerSite","searchText":"frontend"}'::jsonb),
 ('workday-salesforce','{"id":"workday-salesforce","company":"Salesforce","provider":"workday","token":"salesforce/wd12/External_Career_Site","searchText":"frontend"}'::jsonb),
 ('workday-mastercard','{"id":"workday-mastercard","company":"Mastercard","provider":"workday","token":"mastercard/wd1/CorporateCareers","searchText":"frontend"}'::jsonb),
 ('workday-workday','{"id":"workday-workday","company":"Workday","provider":"workday","token":"workday/wd5/Workday","searchText":"frontend"}'::jsonb),
 ('workday-procore','{"id":"workday-procore","company":"Procore","provider":"workday","token":"procore/wd12/Procore_External_Careers","searchText":"frontend"}'::jsonb),
 ('workday-cisco','{"id":"workday-cisco","company":"Cisco","provider":"workday","token":"cisco/wd5/Cisco_Careers","searchText":"frontend"}'::jsonb),
 ('workday-arctic-wolf','{"id":"workday-arctic-wolf","company":"Arctic Wolf","provider":"workday","token":"arcticwolf/wd1/External","searchText":"frontend"}'::jsonb)
ON CONFLICT DO NOTHING;
