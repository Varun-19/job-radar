import { z } from 'zod';
import { decodeHTML } from 'entities';
import { boardSchema, discoveredJobSchema, type JobBoard, type DiscoveredJob } from '@jobradar/contracts';
export class DiscoveryFailure extends Error {}
// Decode twice for Greenhouse's HTML-encoded markup; render only plain text in the client.
function plain(value:string){return decodeHTML(decodeHTML(value)).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<\/(?:p|div|li|h[1-6])>|<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'').trim().slice(0,50000);}
const greenhouse=z.object({jobs:z.array(z.object({id:z.number(),internal_job_id:z.number().nullable(),title:z.string(),location:z.object({name:z.string()}),absolute_url:z.string(),content:z.string().optional(),updated_at:z.string().optional()})).max(5000)});
const ashby=z.object({jobs:z.array(z.object({title:z.string(),location:z.string(),secondaryLocations:z.array(z.object({location:z.string()})).optional(),isListed:z.boolean().optional(),isRemote:z.boolean().nullish(),descriptionPlain:z.string().optional(),descriptionHtml:z.string().optional(),jobUrl:z.string(),publishedAt:z.string().optional()})).max(5000)});
const lever=z.array(z.object({id:z.string(),text:z.string(),categories:z.object({location:z.string().optional()}).optional(),hostedUrl:z.string(),descriptionPlain:z.string().optional(),additionalPlain:z.string().optional(),lists:z.array(z.object({text:z.string(),content:z.string()})).optional()})).max(5000);
export function normalizeBoard(board:JobBoard,payload:unknown,fetchedAt:string):DiscoveredJob[]{
 const source=(id:string,updatedAt:string|null)=>({provider:board.provider,board:board.token,postingId:id,fetchedAt,updatedAt});
 const rows=board.provider==='ashby'?ashby.parse(payload).jobs.filter(j=>j.isListed!==false).map(j=>({company:board.company,title:j.title,location:[j.location,...(j.secondaryLocations??[]).map(l=>l.location)].filter(Boolean).join('; ')||(j.isRemote?'Remote (region unspecified)':'Unknown'),description:plain(j.descriptionPlain??j.descriptionHtml??''),url:j.jobUrl,source:{...source(new URL(j.jobUrl).pathname.split('/').filter(Boolean).at(-1)!,null),publishedAt:j.publishedAt??null}})):board.provider==='greenhouse'?greenhouse.parse(payload).jobs.filter(j=>j.internal_job_id!==null).map(j=>({company:board.company,title:j.title,location:j.location.name||'Unknown',description:plain(j.content??''),url:j.absolute_url,source:source(String(j.id),j.updated_at??null)})):lever.parse(payload).map(j=>({company:board.company,title:j.text,location:j.categories?.location||'Unknown',description:plain([j.descriptionPlain,...(j.lists??[]).map(l=>`${l.text}\n${l.content}`),j.additionalPlain].filter(Boolean).join('\n\n')),url:j.hostedUrl,source:source(j.id,null)}));
 return rows.map(row=>discoveredJobSchema.parse(row));
}
export async function fetchBoard(input:JobBoard,fetcher:typeof fetch=fetch){
 const board=boardSchema.parse(input);
 const url=board.provider==='ashby'?`https://api.ashbyhq.com/posting-api/job-board/${board.token}`:board.provider==='greenhouse'?`https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs?content=true`:`https://${board.provider==='lever-eu'?'api.eu.lever.co':'api.lever.co'}/v0/postings/${board.token}?mode=json`;
 try{
  const response=await fetcher(url,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{Accept:'application/json'}});
  if(!response.ok)throw new DiscoveryFailure(`Board returned HTTP ${response.status}. Check the provider and board token; try later for rate limits or outages.`);
  const reader=response.body?.getReader();if(!reader)throw new DiscoveryFailure('Board returned no response body.');
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12_000_000)throw new DiscoveryFailure('Board response exceeds the 12 MB limit.');chunks.push(value);}}finally{await reader.cancel();}
  const fetchedAt=new Date().toISOString();const jobs=normalizeBoard(board,JSON.parse(Buffer.concat(chunks).toString('utf8')),fetchedAt);return {jobs,fetchedAt};
 }catch(e){if(e instanceof DiscoveryFailure)throw e;throw new DiscoveryFailure('Could not read the board: timeout, network failure, or unsupported response. Existing records remain unchanged.');}
}
