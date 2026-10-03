import { localHost } from './access';
import { createApp } from './app.js';
import { createWorkspaceStore, createRadarService,createNotificationService } from '@jobradar/services';
if(!localHost(process.env.API_HOST??'127.0.0.1'))throw new Error('This personal release only supports loopback API_HOST. Public hosting requires authenticated access and TLS.');
const app = createApp(process.env.DATABASE_URL ? createWorkspaceStore(process.env.DATABASE_URL) : undefined,process.env.DATABASE_URL?createRadarService(process.env.DATABASE_URL):undefined,process.env.DATABASE_URL?createNotificationService(process.env.DATABASE_URL,new URL('../../../.local/mail-outbox',import.meta.url).pathname):undefined);
const port = Number(process.env.API_PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid API_PORT');
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, async () => { await app.close(); });
await app.listen({ port, host: process.env.API_HOST ?? '127.0.0.1' });
