CREATE TABLE job_boards (id text PRIMARY KEY, data jsonb NOT NULL);
-- Public company board verified at https://job-boards.greenhouse.io/datadog.
INSERT INTO job_boards (id,data) VALUES ('greenhouse-datadog','{"id":"greenhouse-datadog","company":"Datadog","provider":"greenhouse","token":"datadog"}'::jsonb);
