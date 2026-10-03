import { z } from 'zod';
const id = z.string().trim().min(1).max(100);
export const stages = ['preparing','applied','recruiter','technical','final','offer','accepted','rejected','withdrawn'] as const;
export const applicationStageSchema = z.enum(stages);
export const resumeSchema = z.object({id,label:z.string().min(1),version:z.number().int().positive(),filename:z.string(),mediaType:z.enum(['application/pdf','text/plain']),text:z.string(),sha256:z.string(),createdAt:z.iso.datetime()});
export type ResumeVersion = z.infer<typeof resumeSchema>;
export const evidenceInputSchema = z.object({id,capability:z.string().trim().min(1).max(200),category:z.string().trim().min(1).max(100),description:z.string().trim().min(1).max(5000),strength:z.enum(['exposure','working','strong','deep']),source:z.enum(['resume','project','manual']),resumeVersionId:id.nullable(),quote:z.string().max(5000),reference:z.string().max(2000)});
export const evidenceSchema = evidenceInputSchema.extend({createdAt:z.iso.datetime()});
export const followUpSchema = z.iso.date().nullable();
export const applicationInputSchema = z.object({id,jobId:id,stage:applicationStageSchema,resumeVersionId:id.nullable(),followUpAt:followUpSchema,submittedAt:z.iso.datetime().nullable().default(null),note:z.string().max(10000)});
export const applicationSchema = applicationInputSchema.omit({note:true}).extend({createdAt:z.iso.datetime(),updatedAt:z.iso.datetime(),submittedAt:z.iso.datetime().nullable()});
export type ApplicationRecord = z.infer<typeof applicationSchema>;
export const activitySchema = z.object({id:z.string(),revision:z.number(),type:z.string(),data:z.unknown(),createdAt:z.iso.datetime()});
export const trackingMutations = [
 z.object({type:z.literal('add-resume'),id,label:z.string().trim().min(1).max(150),filename:z.string().trim().min(1).max(200),mediaType:z.enum(['application/pdf','text/plain']),text:z.string().min(1).max(100000).refine(value=>!!value.trim(),'Résumé text is empty'),originalBase64:z.string().max(5600000).optional()}),
 z.object({type:z.literal('add-evidence'),evidence:evidenceInputSchema}),
 z.object({type:z.literal('create-application'),application:applicationInputSchema}),
 z.object({type:z.literal('update-application'),id,stage:applicationStageSchema,resumeVersionId:id.nullable(),followUpAt:followUpSchema,submittedAt:z.iso.datetime().nullable().default(null),note:z.string().max(10000)})
] as const;
export const resumeUploadSchema = z.object({expectedRevision:z.number().int().nonnegative(),label:z.string().trim().min(1).max(150),filename:z.string().trim().min(1).max(200),base64:z.string().min(1).max(5600000)});
