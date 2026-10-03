import { z } from 'zod';
export const evaluationInputSchema=z.object({
 id:z.string().min(1).max(100),jobId:z.string().min(1).max(100),profileVersion:z.number().int().positive(),postingRevisionId:z.string().nullable(),
 roleFamily:z.enum(['frontend_web','frontend_platform','ai_product','frontend_dominant','backend_specialist','infra_specialist','ml_specialist','management','other']),
 alignment:z.enum(['primary','selective','review','outside']),fit:z.enum(['strong','partial','unknown']),eligibility:z.enum(['confirmed','unknown','ineligible']),
 levelAlignment:z.enum(['target','below_target','above_target','calibration_required']),locationAlignment:z.enum(['in_target','outside_target','unknown']),staffScope:z.enum(['high','medium','low','unknown']),
 readiness:z.enum(['ready','needs_work','unknown']),readinessNotes:z.string().max(5000),
 reasoning:z.string().trim().min(20).max(10000),postingQuotes:z.array(z.string().trim().min(1).max(2000)).min(1).max(20),
 evidenceIds:z.array(z.string()).max(50),strengths:z.array(z.string().max(2000)).max(20),gaps:z.array(z.string().max(2000)).max(20),unknowns:z.array(z.string().max(2000)).max(20),
 producer:z.enum(['manual_review','assisted_review'])
});
export const evaluationSchema=evaluationInputSchema.extend({status:z.enum(['pending','accepted','rejected']),createdAt:z.iso.datetime(),reviewedAt:z.iso.datetime().nullable()});
export type EvaluationProposal=z.infer<typeof evaluationInputSchema>;
