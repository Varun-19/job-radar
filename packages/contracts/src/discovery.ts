import { z } from 'zod';
export const boardSchema=z.object({id:z.string().min(1).max(100),company:z.string().trim().min(1).max(200),provider:z.enum(['greenhouse','lever','lever-eu','ashby']),token:z.string().trim().regex(/^[a-zA-Z0-9_-]{1,100}$/)});
export const provenanceSchema=z.object({provider:boardSchema.shape.provider,board:z.string().max(100),postingId:z.string().max(100),fetchedAt:z.iso.datetime(),updatedAt:z.string().nullable(),publishedAt:z.string().nullable().optional()});
export const discoveredJobSchema=z.object({company:z.string().max(200),title:z.string().min(1).max(300),location:z.string().max(300),description:z.string().max(50000),url:z.url().refine(v=>['https:','http:'].includes(new URL(v).protocol)),source:provenanceSchema});
export const discoveryRequestSchema=z.object({board:boardSchema});
export const discoveryResponseSchema=z.object({jobs:z.array(discoveredJobSchema).max(5000),fetchedAt:z.iso.datetime()});
export type JobBoard=z.infer<typeof boardSchema>;
export type DiscoveredJob=z.infer<typeof discoveredJobSchema>;
