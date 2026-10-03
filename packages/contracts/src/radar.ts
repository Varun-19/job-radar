import { z } from 'zod';
import { discoveredJobSchema } from './discovery';
export const scanScheduleSchema=z.object({boardId:z.string(),enabled:z.boolean(),intervalMinutes:z.number().int().min(30).max(10080),nextRunAt:z.iso.datetime(),leaseUntil:z.iso.datetime().nullable()});
export const scanRunSchema=z.object({id:z.string(),boardId:z.string(),status:z.enum(['running','succeeded','failed']),startedAt:z.iso.datetime(),finishedAt:z.iso.datetime().nullable(),message:z.string(),count:z.number(),newCount:z.number(),changedCount:z.number()});
export const inboxItemSchema=z.object({id:z.string(),boardId:z.string(),posting:discoveredJobSchema,version:z.number().int().positive(),firstSeenAt:z.iso.datetime(),lastSeenAt:z.iso.datetime(),changedAt:z.iso.datetime(),change:z.enum(['new','changed'])});
export const radarSchema=z.object({schedules:z.array(scanScheduleSchema),runs:z.array(scanRunSchema),inbox:z.array(inboxItemSchema)});
export const scheduleInputSchema=z.object({boardId:z.string().min(1).max(100),enabled:z.boolean(),intervalMinutes:z.number().int().min(30).max(10080)});
export type RadarSnapshot=z.infer<typeof radarSchema>;
