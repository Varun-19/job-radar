import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

/** Server only. Call explicitly when persistence is introduced. */
export function createDatabase(url: string) {
  const client = postgres(url, { max: 5 });
  return { db: drizzle(client), close: () => client.end() };
}
