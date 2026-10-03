import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthSchema } from '@jobradar/contracts';

export function createApp() {
  const app = Fastify({ logger: true });
  app.register(cors, { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' });
  app.get('/health', async () => healthSchema.parse({ status: 'ok', service: 'jobradar-api', version: '0.1.0', database: 'not-configured' }));
  return app;
}
