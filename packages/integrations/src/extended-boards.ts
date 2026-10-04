import {XMLParser,XMLValidator} from 'fast-xml-parser';
import { z } from 'zod';
import { discoveredJobSchema, type JobBoard, type DiscoveredJob } from '@jobradar/contracts';
import { DiscoveryFailure, plain, readJson, readText } from './boards';
const workdayPage=z.object({total:z.number().int().nonnegative(),jobPostings:z.array(z.object({title:z.string(),externalPath:z.string().regex(/^\/job\/[a-zA-Z0-9_./%-]+$/),locationsText:z.string().optional()}))});
const oraclePage=z.object({items:z.array(z.object({TotalJobsCount:z.number().optional(),requisitionList:z.array(z.object({Id:z.union([z.string(),z.number()]),Title:z.string(),PrimaryLocation:z.string().optional(),ShortDescriptionStr:z.string().nullish(),PostedDate:z.string().nullish()})).optional()}))});
function date(value:unknown){if(typeof value!=='string'&&typeof value!=='number')return null;const d=new Date(value);return Number.isFinite(d.getTime())?d.toISOString():null;}
async function mapBounded<T,U>(rows:T[],fn:(row:T)=>Promise<U>):Promise<U[]>{const out:U[]=new Array(rows.length);let next=0;await Promise.all(Array.from({length:Math.min(2,rows.length)},async()=>{while(next<rows.length){const i=next++;out[i]=await fn(rows[i]);await new Promise(resolve=>setTimeout(resolve,150));}}));return out;}
export async function fetchExtended(board:JobBoard,fetcher:typeof fetch,signal:AbortSignal){
 const fetchedAt=new Date().toISOString();
 const get=(url:string,body?:unknown)=>readJson(url,fetcher,AbortSignal.any([signal,AbortSignal.timeout(20000)]),body);
 const job=(id:string,title:string,location:string,description:string,url:string,company=board.company,publishedAt:string|null=null)=>discoveredJobSchema.parse({company:plain(company),title:plain(title),location:location||'Remote (region unspecified)',description:plain(description),url,source:{provider:board.provider,board:board.token,postingId:id,fetchedAt,updatedAt:null,publishedAt}});
 let jobs:DiscoveredJob[]=[];
 if(board.provider==='workday'){
  const [tenant,wd,site]=board.token.split('/');const base=`https://${tenant}.${wd}.myworkdayjobs.com`;const endpoint=`${base}/wday/cxs/${tenant}/${site}`;
  const rows:z.infer<typeof workdayPage>['jobPostings']=[];let total=0;
  for(let offset=0;offset<5000;offset+=20){const page=workdayPage.parse(await get(`${endpoint}/jobs`,{appliedFacets:{},limit:20,offset,searchText:board.searchText??''}));if(offset===0)total=page.total;if(total>5000)throw new DiscoveryFailure('This board exceeds the supported 5,000-posting scan limit.');rows.push(...page.jobPostings);if(rows.length>=total)break;if(!page.jobPostings.length)throw new DiscoveryFailure('Incomplete Workday pagination; no successful snapshot recorded.');}
  if(rows.length!==total)throw new DiscoveryFailure('Workday posting count changed during pagination; retry the scan.');
  jobs=await mapBounded(rows,async row=>{const payload=z.object({jobPostingInfo:z.object({jobDescription:z.string(),jobReqId:z.string().optional(),location:z.string().optional(),startDate:z.string().optional()})}).parse(await get(`${endpoint}${row.externalPath}`));const info=payload.jobPostingInfo;return job(info.jobReqId??row.externalPath,row.title,row.locationsText??info.location??'Unknown',info.jobDescription,`${base}/${site}${row.externalPath}` ,board.company,date(info.startDate));});
 }else if(board.provider==='smartrecruiters'){
  const endpoint=`https://api.smartrecruiters.com/v1/companies/${board.token}/postings`;
  const schema=z.object({totalFound:z.number().int().nonnegative(),content:z.array(z.object({id:z.string().regex(/^[a-zA-Z0-9-]+$/)}))});
  const rows:z.infer<typeof schema>['content']=[];let total=0;
  for(let offset=0;offset<5000;offset+=100){const page=schema.parse(await get(`${endpoint}?limit=100&offset=${offset}${board.searchText?`&q=${encodeURIComponent(board.searchText)}`:''}`));if(offset===0)total=page.totalFound;if(total>5000)throw new DiscoveryFailure('SmartRecruiters exceeds the supported scan limit. Use a source query.');rows.push(...page.content);if(rows.length>=total)break;if(!page.content.length)throw new DiscoveryFailure('Incomplete SmartRecruiters pagination.');}
  if(rows.length!==total)throw new DiscoveryFailure('SmartRecruiters inventory changed during pagination.');
  jobs=await mapBounded(rows,async row=>{const detail=z.object({name:z.string(),applyUrl:z.url(),releasedDate:z.string().optional(),location:z.object({city:z.string().optional(),region:z.string().optional(),country:z.string().optional(),remote:z.boolean().optional()}),jobAd:z.object({sections:z.record(z.string(),z.object({title:z.string().optional(),text:z.string()}))})}).parse(await get(`${endpoint}/${row.id}`));const target=new URL(detail.applyUrl);if(target.protocol!=='https:'||!['jobs.smartrecruiters.com','www.smartrecruiters.com'].includes(target.hostname)||target.username||target.password)throw new DiscoveryFailure('Unexpected SmartRecruiters application URL.');return job(row.id,detail.name,[detail.location.city,detail.location.region,detail.location.country,detail.location.remote?'Remote':''].filter(Boolean).join(', '),Object.values(detail.jobAd.sections).map(s=>`${s.title??''}\n${s.text}`).join('\n\n'),detail.applyUrl,board.company,date(detail.releasedDate));});
 }else if(board.provider==='oracle'){
  const [host,site]=board.token.split('/');const base=`https://${host}`;let complete=false;
  for(let offset=0;offset<5000;offset+=200){const page=oraclePage.parse(await get(`${base}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.secondaryLocations&finder=findReqs;siteNumber=${site},limit=200,offset=${offset}`));const rows=page.items[0]?.requisitionList;if(!rows)throw new DiscoveryFailure('Oracle returned an unsupported response.');
   jobs.push(...rows.map(row=>job(String(row.Id),row.Title,row.PrimaryLocation??'Unknown',row.ShortDescriptionStr??'',`${base}/hcmUI/CandidateExperience/en/sites/${site}/job/${encodeURIComponent(String(row.Id))}`,board.company,date(row.PostedDate))));
   if(rows.length<200){complete=true;break;}
  }if(!complete)throw new DiscoveryFailure('Oracle board exceeds the supported 5,000-posting scan limit.');
 }else if(board.provider==='workable'){
  const payload=z.object({jobs:z.array(z.object({shortcode:z.string().optional(),title:z.string(),url:z.string().optional(),application_url:z.string().optional(),location:z.union([z.string(),z.object({city:z.string().nullish(),country:z.string().nullish()})]).nullish(),description:z.string().optional(),published_on:z.string().optional()})).max(5000)}).parse(await get(`https://apply.workable.com/api/v1/widget/accounts/${board.token}?details=true`));
  jobs=payload.jobs.map(row=>{const url=row.url??row.application_url;if(!url)throw new DiscoveryFailure('Workable posting has no URL.');return job(row.shortcode??new URL(url).pathname,row.title,typeof row.location==='string'?row.location:[row.location?.city,row.location?.country].filter(Boolean).join(', '),row.description??'',url,board.company,date(row.published_on));});
 }else if(board.provider==='weworkremotely'){
  const xml=await readText('https://weworkremotely.com/remote-jobs.rss',fetcher,AbortSignal.any([signal,AbortSignal.timeout(20000)]));
  if(/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true)throw new DiscoveryFailure('Unsupported RSS XML; no successful snapshot recorded.');
  const parsed=new XMLParser({ignoreAttributes:true,processEntities:false,isArray:name=>name==='item'}).parse(xml);
  const feed=z.object({rss:z.object({channel:z.object({item:z.array(z.object({title:z.string(),link:z.string(),description:z.string(),region:z.string().optional(),country:z.union([z.string(),z.number()]).optional(),pubDate:z.string().optional()})).max(5000)})})}).parse(parsed);
  jobs=feed.rss.channel.item.map(row=>{const separator=row.title.indexOf(':');if(separator<1)throw new DiscoveryFailure('RSS posting lacks an employer label.');const url=new URL(row.link);if(url.hostname!=='weworkremotely.com')throw new DiscoveryFailure('Unexpected RSS posting host.');const locations=[row.region,row.country?String(row.country):''].filter(Boolean).join('; ');return job(url.pathname,row.title.slice(separator+1).trim(),locations.length>280?`Remote · ${(row.region??'').slice(0,180)} · country list in description`:`Remote · ${locations||'region unspecified'}`,`Source hiring locations: ${locations||'unspecified'}\n${row.description}`,row.link,plain(row.title.slice(0,separator)),date(row.pubDate));});
 }else if(board.provider==='remoteok'){
  const payload=z.array(z.unknown()).max(5001).parse(await get('https://remoteok.com/api'));
  const rowSchema=z.object({id:z.union([z.string(),z.number()]),company:z.string(),position:z.string(),location:z.string().optional(),description:z.string(),url:z.url().refine(url=>new URL(url).hostname.toLowerCase()==='remoteok.com'),date:z.string().optional()});
  jobs=payload.filter(row=>!(row&&typeof row==='object'&&'legal' in row)).map(raw=>{const row=rowSchema.parse(raw);return job(String(row.id),row.position,row.location??'',row.description,row.url,row.company,date(row.date));});
 }else if(board.provider==='remotive'){
  const payload=z.object({jobs:z.array(z.object({id:z.number(),company_name:z.string(),title:z.string(),candidate_required_location:z.string(),description:z.string(),url:z.string(),publication_date:z.string()})).max(5000)}).parse(await get('https://remotive.com/api/remote-jobs'));
  jobs=payload.jobs.map(row=>job(String(row.id),row.title,row.candidate_required_location,row.description,row.url,row.company_name,date(row.publication_date)));
 }else if(board.provider==='arbeitnow'){
  // The public feed supplies its newest page; this is a feed window, not the entire site's inventory.
  const payload=z.object({data:z.array(z.object({slug:z.string(),company_name:z.string(),title:z.string(),location:z.string(),remote:z.boolean().default(false),description:z.string(),url:z.string(),created_at:z.union([z.number(),z.string().regex(/^\d+$/)]).transform(Number)})).max(5000)}).parse(await get('https://www.arbeitnow.com/api/job-board-api'));
  jobs=payload.data.map(row=>job(row.slug,row.title,`${row.location}${row.remote?' · Remote':''}`,row.description,row.url,row.company_name,date(row.created_at*1000)));
 }
 const identities=new Map<string,DiscoveredJob>();for(const row of jobs){const old=identities.get(row.source.postingId);if(old&&!['remoteok','remotive','arbeitnow','weworkremotely'].includes(board.provider))throw new DiscoveryFailure('Source returned duplicate identifiers; retry the scan.');if(!old||Date.parse(row.source.publishedAt??'')>Date.parse(old.source.publishedAt??''))identities.set(row.source.postingId,row);}jobs=[...identities.values()];
 return {jobs,fetchedAt};
}
