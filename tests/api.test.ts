import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../apps/api/src/app.js';
import { healthSchema } from '@jobradar/contracts';
test('health reports shell status without claiming persistence', async () => { const app = createApp(); try { const response = await app.inject({ method: 'GET', url: '/health' }); assert.equal(response.statusCode, 200); assert.equal(healthSchema.parse(response.json()).database, 'not-configured'); } finally { await app.close(); } });
test('unknown endpoints return 404', async () => { const app = createApp(); try { assert.equal((await app.inject('/applications')).statusCode, 404); } finally { await app.close(); } });
