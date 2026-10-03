import { createApp } from './app.js';
const app = createApp();
const port = Number(process.env.API_PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid API_PORT');
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, async () => { await app.close(); });
await app.listen({ port, host: process.env.API_HOST ?? '127.0.0.1' });
