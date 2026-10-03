import { z } from 'zod';

export const healthSchema = z.object({ status: z.literal('ok'), service: z.literal('jobradar-api'), version: z.string(), database: z.literal('not-configured') });
export type HealthResponse = z.infer<typeof healthSchema>;
