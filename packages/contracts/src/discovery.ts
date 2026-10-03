import { z } from 'zod';
export const boardSchema=z.object({id:z.string().min(1).max(100),company:z.string().trim().min(1).max(200),provider:z.enum(['greenhouse','lever','lever-eu','ashby','workable','workday','oracle','remoteok','remotive','arbeitnow','weworkremotely']),token:z.string().trim().max(200).regex(/^[a-zA-Z0-9_.\/-]+$/),searchText:z.string().trim().max(200).optional()}).superRefine((board,ctx)=>{
 const valid=board.provider==='workday'?/^[a-z0-9-]+\/wd[0-9]+\/[a-zA-Z0-9_-]+$/.test(board.token):board.provider==='oracle'?/^[a-z0-9-]+\.fa\.[a-z0-9]+\.oraclecloud\.com\/[a-zA-Z0-9_-]+$/.test(board.token):['remoteok','remotive','arbeitnow','weworkremotely'].includes(board.provider)?board.token==='all':/^[a-zA-Z0-9_-]{1,100}$/.test(board.token);
 if(!valid)ctx.addIssue({code:'custom',path:['token'],message:'Use the provider’s supported board token format.'});
});
export const provenanceSchema=z.object({provider:z.enum(['greenhouse','lever','lever-eu','ashby','workable','workday','oracle','remoteok','remotive','arbeitnow','linkedin','indeed','naukri','glassdoor','wellfound','weworkremotely','company']),board:z.string().max(200),postingId:z.string().max(1000),fetchedAt:z.iso.datetime(),updatedAt:z.string().nullable(),publishedAt:z.string().nullable().optional()});
export const discoveredJobSchema=z.object({company:z.string().max(200),title:z.string().min(1).max(300),location:z.string().max(300),description:z.string().max(50000),url:z.url().refine(v=>['https:','http:'].includes(new URL(v).protocol)),source:provenanceSchema});
export const discoveryRequestSchema=z.object({board:boardSchema});
export const discoveryResponseSchema=z.object({jobs:z.array(discoveredJobSchema).max(5000),fetchedAt:z.iso.datetime()});
export type JobBoard=z.infer<typeof boardSchema>;
export type DiscoveredJob=z.infer<typeof discoveredJobSchema>;

export const externalProviderSchema=z.enum(['linkedin','indeed','naukri','glassdoor','wellfound','weworkremotely','company']);
export const externalPostingSchema=z.object({provider:externalProviderSchema,company:z.string().trim().min(1).max(200),title:z.string().trim().min(1).max(300),location:z.string().trim().min(1).max(300),description:z.string().trim().min(1).max(50000),url:z.url().max(2000)}).superRefine((row,ctx)=>{
 const url=new URL(row.url);const hosts:Record<string,string>= {linkedin:'linkedin.com',indeed:'indeed.com',naukri:'naukri.com',glassdoor:'glassdoor.com',wellfound:'wellfound.com',weworkremotely:'weworkremotely.com'};const host=hosts[row.provider];
 if(url.protocol!=='https:'||url.username||url.password||(host&&url.hostname!==host&&!url.hostname.endsWith('.'+host)))ctx.addIssue({code:'custom',path:['url'],message:'Use an HTTPS posting URL on the selected provider.'});
});
export const externalPostingsSchema=z.array(externalPostingSchema).min(1).max(100);
export function normalizeExternalPostings(input:unknown,fetchedAt=new Date().toISOString()):DiscoveredJob[]{
 return externalPostingsSchema.parse(input).map(row=>{const url=new URL(row.url);url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_|^(trackingId|refId|trk|source|ref)$/i.test(key))url.searchParams.delete(key);const canonical=url.toString();return discoveredJobSchema.parse({...row,url:canonical,source:{provider:row.provider,board:url.hostname,postingId:canonical,fetchedAt,updatedAt:null}});});
}
