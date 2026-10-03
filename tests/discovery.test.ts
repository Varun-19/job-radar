import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchBoard, normalizeBoard, DiscoveryFailure } from '../apps/api/src/discovery';
import { boardSchema } from '@jobradar/contracts';
import { createApp } from '../apps/api/src/app';
const board={id:'fixture',company:'Fixture Co',provider:'greenhouse' as const,token:'fixture'};
const now='2026-10-03T00:00:00Z';
const posting={id:1,internal_job_id:2,title:'Staff Frontend Engineer',location:{name:'Bengaluru'},absolute_url:'https://example.com/job/1',content:'&lt;p&gt;Build web &amp;amp; AI&lt;/p&gt;',updated_at:'2026-10-02T00:00:00Z'};
test('Greenhouse normalization retains source timestamps, decodes text and omits prospect posts',()=>{
 const jobs=normalizeBoard(board,{jobs:[posting,{...posting,id:3,internal_job_id:null}]},now);
 assert.equal(jobs.length,1);assert.equal(jobs[0].description,'Build web & AI');assert.equal(jobs[0].source.updatedAt,posting.updated_at);assert.equal(jobs[0].source.fetchedAt,now);assert.equal(jobs[0].source.postingId,'1');
});
test('Lever normalization includes list content and keeps publication time unknown',()=>{
 const [job]=normalizeBoard({...board,provider:'lever-eu'},[{id:'sap1',text:'SAP consultant',hostedUrl:'https://example.com/sap',categories:{location:'India'},descriptionPlain:'SAP integrations',lists:[{text:'Requirements',content:'<ul><li>S/4HANA</li></ul>'}]}],now);
 assert.match(job.description,/S\/4HANA/);assert.equal(job.source.updatedAt,null);assert.equal(job.source.provider,'lever-eu');
});
test('fetch is pinned to the provider host and rejects failures without inventing an empty successful scan',async()=>{
 let seen='';const fetcher:typeof fetch=async(url,options)=>{seen=String(url);assert.equal(options?.redirect,'error');return new Response(JSON.stringify({jobs:[posting]}));};
 assert.equal((await fetchBoard(board,fetcher)).jobs.length,1);assert.equal(seen,'https://boards-api.greenhouse.io/v1/boards/fixture/jobs?content=true');
 await assert.rejects(fetchBoard(board,async()=>new Response('',{status:429})),DiscoveryFailure);
 await assert.rejects(fetchBoard(board,async()=>new Response('{invalid')),DiscoveryFailure);
 assert.equal(boardSchema.safeParse({...board,token:'https://localhost/secret'}).success,false);
 assert.throws(()=>normalizeBoard(board,{jobs:[{...posting,absolute_url:'javascript:alert(1)'}]},now));
});
test('discovery endpoint rejects unexpected origins and invalid board inputs before fetching',async()=>{const app=createApp();try{assert.equal((await app.inject({method:'POST',url:'/discovery/preview',headers:{origin:'https://other.example'},payload:{board}})).statusCode,403);assert.equal((await app.inject({method:'POST',url:'/discovery/preview',payload:{board:{...board,token:'../'}}})).statusCode,400);}finally{await app.close();}});
test('Ashby retains publication time and secondary locations, excluding unlisted postings',()=>{
 const jobs=normalizeBoard({...board,provider:'ashby'}, {jobs:[{title:'Staff Frontend Engineer',location:'Bengaluru',secondaryLocations:[{location:'India Remote'}],isListed:true,isRemote:null,descriptionPlain:'Own frontend architecture',jobUrl:'https://jobs.ashbyhq.com/fixture/abc-123',publishedAt:'2026-10-01T00:00:00Z'},{title:'Unlisted',location:'India',isListed:false,jobUrl:'https://jobs.ashbyhq.com/fixture/hidden'}]},now);
 assert.equal(jobs.length,1);assert.equal(jobs[0].source.postingId,'abc-123');assert.equal(jobs[0].source.publishedAt,'2026-10-01T00:00:00Z');assert.equal(jobs[0].source.updatedAt,null);assert.match(jobs[0].location,/India Remote/);
});
