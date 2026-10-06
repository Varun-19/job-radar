import { z } from 'zod';

export const healthSchema = z.object({ status: z.enum(['ok','degraded']), service: z.literal('jobradar-api'), version: z.string(), database: z.enum(['not-configured','connected','unavailable']) });
export type HealthResponse = z.infer<typeof healthSchema>;

export * from './workspace';
export * from './tracking';

export * from './discovery';
export * from './source-coverage';
export * from './radar';
export * from './evaluations';

export * from './recruiters';

export * from './alerts';

export * from './review-packet';
