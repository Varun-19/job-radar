import { z } from 'zod';
const id=z.string().trim().min(1).max(100);
const webUrl=z.url().max(2000).refine(v=>['http:','https:'].includes(new URL(v).protocol),'Use an HTTP or HTTPS URL');
export const contactInputSchema=z.object({id,name:z.string().trim().min(1).max(200),company:z.string().trim().min(1).max(200),title:z.string().trim().min(1).max(200),profileUrl:webUrl,sourceUrl:webUrl,sourceQuote:z.string().trim().min(1).max(5000),observedAt:z.iso.date(),recruitingStatus:z.enum(['unverified','recruiting','not_recruiting']),notes:z.string().max(5000),jobIds:z.array(id).max(50)});
export const contactSchema=contactInputSchema.extend({createdAt:z.iso.datetime(),updatedAt:z.iso.datetime()});
export const outreachInputSchema=z.object({id,contactId:id,jobId:id.nullable(),channel:z.enum(['linkedin','email','other']),message:z.string().trim().min(1).max(10000),stage:z.enum(['draft','sent','replied','closed']),sentAt:z.iso.datetime().nullable(),followUpAt:z.iso.date().nullable(),note:z.string().max(5000)});
export const outreachSchema=outreachInputSchema.extend({createdAt:z.iso.datetime(),updatedAt:z.iso.datetime()});
export const recruiterMutations=[z.object({type:z.literal('save-contact'),contact:contactInputSchema}),z.object({type:z.literal('save-outreach'),outreach:outreachInputSchema})] as const;
