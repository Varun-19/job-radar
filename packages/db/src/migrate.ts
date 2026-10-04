import postgres from 'postgres';
import { readFile } from 'node:fs/promises';
const url = process.env.DATABASE_URL;
if (!url) throw new Error('Set DATABASE_URL before running migrations.');
const sql = postgres(url,{max:1});
try {
 await sql.begin(async tx => {
  await tx`SELECT pg_advisory_xact_lock(20261003)`;
  await tx`CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
  for (const version of ['0001_workspace','0002_tracking','0003_discovery','0004_posting_history','0005_radar','0006_source_coverage','0007_evaluations','0008_recruiters','0009_alerts','0010_source_presence','0011_notifications','0012_extended_sources','0013_additional_sources','0014_company_coverage','0015_noon_source','0016_razorpay_source']) {
   const applied=await tx`SELECT version FROM schema_migrations WHERE version = ${version}`;
   if(!applied.length){await tx.unsafe(await readFile(new URL(`../migrations/${version}.sql`,import.meta.url),'utf8'));await tx`INSERT INTO schema_migrations (version) VALUES (${version})`;}
  }
 });
 console.info('Workspace migrations applied.');
} finally { await sql.end(); }
