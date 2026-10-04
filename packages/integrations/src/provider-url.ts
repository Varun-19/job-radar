import {normalizeExternalPostings,providerUrlSchema} from '@jobradar/contracts';
import {DiscoveryFailure,plain,readText} from './boards';
export function structuredPosting(html:string,input:unknown){
 const request=providerUrlSchema.parse(input);const candidates:any[]=[];
 function visit(node:any,depth=0){if(depth>8||candidates.length>=200)return;if(Array.isArray(node)){for(const entry of node.slice(0,200))visit(entry,depth+1);}else if(node&&typeof node==='object'){if([node['@type']].flat().includes('JobPosting'))candidates.push(node);if(node['@graph'])visit(node['@graph'],depth+1);}}
 for(const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{visit(JSON.parse(match[1]));}catch{continue;}}
 if(candidates.length!==1)throw new DiscoveryFailure('This page does not expose one complete structured job posting. Use reviewed JSON import or your browser; no login or access controls are bypassed.');
 const row=candidates[0];const company=row.hiringOrganization?.name;const title=row.title;const description=row.description;
 if(typeof company!=='string'||typeof title!=='string'||typeof description!=='string')throw new DiscoveryFailure('Structured posting is incomplete; use reviewed JSON import.');
 const locations=[row.jobLocation].flat().filter(Boolean).map((l:any)=>{const a=l.address??l;return [a.addressLocality,a.addressRegion,typeof a.addressCountry==='string'?a.addressCountry:a.addressCountry?.name].filter(v=>typeof v==='string').join(', ');}).filter(Boolean);
 const restrictions=[row.applicantLocationRequirements].flat().filter(Boolean).map((l:any)=>l.name??l.address?.addressCountry).filter(v=>typeof v==='string');
 const location=[...locations,...restrictions,row.jobLocationType==='TELECOMMUTE'?'Remote (verify listed country restrictions)':''].filter(Boolean).join('; ')||'Location unspecified';
 return normalizeExternalPostings([{...request,company:plain(company),title:plain(title),description:plain(description),location,url:request.url}])[0];
}
export async function previewProviderUrl(input:unknown,fetcher:typeof fetch=fetch){const request=providerUrlSchema.parse(input);try{const html=await readText(request.url,((url,init)=>fetcher(url,{...init,headers:{...init?.headers,Accept:'text/html'}})) as typeof fetch,AbortSignal.timeout(20000));return structuredPosting(html,request);}catch(e){if(e instanceof DiscoveryFailure)throw e;throw new DiscoveryFailure('Provider page is unavailable or requires browser access. Use reviewed JSON/MCP import.');}}
