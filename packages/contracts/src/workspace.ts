import { boardSchema, provenanceSchema } from './discovery';
import { z } from 'zod';
import { resumeSchema, evidenceSchema, applicationSchema, activitySchema, trackingMutations } from './tracking';
const id = z.string().trim().min(1).max(100);
export const tierSchema = z.enum(['strategic-target','target','watch','opportunistic','excluded','unclassified']);
const list = z.array(z.string().trim().min(1).max(200)).max(100);
export const profileSchema = z.object({ id, name:z.string().trim().min(1).max(150), version:z.number().int().positive(), roleFamilies:list, levels:list, locations:list, keywords:list, exclusions:list });
export type SearchProfile = z.infer<typeof profileSchema>;
export const jobSchema = z.object({ id, profileId:id, company:z.string().trim().min(1).max(200), title:z.string().trim().min(1).max(300), location:z.string().trim().min(1).max(300), description:z.string().max(50000), url:z.string().max(2000).refine(value => {if(!value)return true;try{return ['http:','https:'].includes(new URL(value).protocol);}catch{return false;}}, 'Use an HTTP or HTTPS URL'), alignment:z.enum(['primary','selective','review','outside']), fit:z.enum(['strong','partial','unknown']), eligibility:z.enum(['confirmed','unknown','ineligible']), createdAt:z.iso.datetime(), shortlisted:z.boolean(), source:provenanceSchema.optional() });
export const workspaceSchema = z.object({ revision:z.number().int().nonnegative(), boards:z.array(boardSchema).default([]), profiles:z.array(profileSchema), tiers:z.record(z.string(),z.record(z.string(),tierSchema)), jobs:z.array(jobSchema), resumes:z.array(resumeSchema).default([]), evidence:z.array(evidenceSchema).default([]), applications:z.array(applicationSchema).default([]), activities:z.array(activitySchema).default([]) });
export type WorkspaceSnapshot = z.infer<typeof workspaceSchema>;
export const mutationSchema = z.discriminatedUnion('type',[
 z.object({type:z.literal('add-job'),job:jobSchema}),
 z.object({type:z.literal('save-board'),board:boardSchema}),
 z.object({type:z.literal('assess-job'),id,alignment:jobSchema.shape.alignment,fit:jobSchema.shape.fit,eligibility:jobSchema.shape.eligibility}),
 z.object({type:z.literal('shortlist'),id,shortlisted:z.boolean(), source:provenanceSchema.optional()}),
 z.object({type:z.literal('set-tier'),profileId:id,company:z.string().trim().min(1).max(200),tier:tierSchema}),
 z.object({type:z.literal('save-profile'),profile:profileSchema}),
 ...trackingMutations
]);
export type WorkspaceMutation = z.infer<typeof mutationSchema>;
export const mutationRequestSchema = z.object({ expectedRevision:z.number().int().nonnegative(),mutations:z.array(mutationSchema).min(1).max(500) });
export const initialProfiles: SearchProfile[] = [
 {id:'staff',name:'Staff · Frontend / Platform / AI Product',version:1,roleFamilies:['Frontend/Web','Frontend Platform','AI Product'],levels:['Staff','L6 equivalent'],locations:['Bengaluru','Chennai','India Remote','Hyderabad'],keywords:['frontend architecture','web platform','application-layer AI'],exclusions:['ML training/research','Storage specialization','Engineering management']},
 {id:'sap',name:'SAP consultant · exploratory',version:1,roleFamilies:['SAP consulting'],levels:[],locations:[],keywords:[],exclusions:[]}
];
