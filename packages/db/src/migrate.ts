import postgres from 'postgres';
import { readFile } from 'node:fs/promises';
const url = process.env.DATABASE_URL;
if (!url) throw new Error('Set DATABASE_URL before running migrations.');
const sql = postgres(url,{max:1});
try {
 await sql.begin(async tx => {
  await tx`SELECT pg_advisory_xact_lock(20261003)`;
  await tx`CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
  for (const version of ['0001_workspace','0002_tracking']) {
   const applied=await tx`SELECT version FROM schema_migrations WHERE version = ${version}`;
   if(!applied.length){await tx.unsafe(await readFile(new URL(`../migrations/${version}.sql`,import.meta.url),'utf8'));await tx`INSERT INTO schema_migrations (version) VALUES (${version})`;}
  }
 });
 console.info('Workspace migrations applied.');
} finally { await sql.end(); }
