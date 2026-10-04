import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardSchema } from '@jobradar/contracts';
import { fetchBoard, DiscoveryFailure } from '@jobradar/integrations';
const board={id:'extended',company:'Fixture',provider:'workday' as const,token:'fixture/wd5/External'};
test('enterprise tokens cannot address arbitrary hosts or paths',()=>{
 for(const token of ['localhost/CX_1','evil.com/CX_1','tenant.fa.us2.oraclecloud.com/../admin','tenant.fa.us2.oraclecloud.com/CX_1?x=1'])assert.equal(boardSchema.safeParse({...board,provider:'oracle',token}).success,false);
 for(const token of ['fixture/wd5/External','tenant/wd12/external_experienced'])assert.equal(boardSchema.safeParse({...board,token}).success,true);
 assert.equal(boardSchema.safeParse({...board,token:'fixture/wd5/../../secret'}).success,false);
});
test('Workday paginates completely and fetches descriptions rather than scoring listing summaries',async()=>{
 let pages=0,details=0;
 const fetcher:typeof fetch=async(url,options)=>{assert.equal(options?.redirect,'error');assert.match(String(url),/^https:\/\/fixture.wd5.myworkdayjobs.com\/wday\/cxs\/fixture\/External\//);
 if(String(url).endsWith('/jobs')){pages++;const body=JSON.parse(String(options?.body));const length=body.offset===0?20:1;return Response.json({total:21,jobPostings:Array.from({length},(_,i)=>({title:`Staff Frontend ${body.offset+i}`,externalPath:`/job/India/Staff_${body.offset+i}`,locationsText:'India'}))});}
 details++;return Response.json({jobPostingInfo:{jobDescription:'<p>Own frontend platform architecture</p>',jobReqId:`R${details}`}});
 };
 const result=await fetchBoard(board,fetcher);assert.equal(pages,2);assert.equal(details,21);assert.equal(result.jobs.length,21);assert.equal(result.jobs[0].description,'Own frontend platform architecture');
});
test('truncated or failed enterprise pagination never reports a successful empty scan',async()=>{
 await assert.rejects(fetchBoard(board,async()=>Response.json({total:21,jobPostings:[]})),DiscoveryFailure);
 await assert.rejects(fetchBoard(board,async()=>new Response('',{status:403})),DiscoveryFailure);
});
test('remote feeds preserve employer, source attribution and unknown country restrictions',async()=>{
 const result=await fetchBoard({...board,provider:'remoteok',token:'all'},async()=>Response.json([{legal:'Attribute Remote OK'},{id:'1',position:'Staff Frontend',company:'Actual Employer',description:'React',location:'',url:'https://remoteok.com/remote-jobs/1',date:'2026-10-01T12:00:00Z'}]));
 assert.equal(result.jobs[0].company,'Actual Employer');assert.equal(result.jobs[0].location,'Remote (region unspecified)');assert.equal(result.jobs[0].source.provider,'remoteok');assert.equal(result.jobs[0].url,'https://remoteok.com/remote-jobs/1');
});
test('Oracle pages preserve stable requisition identity and do not invent publication times',async()=>{
 const result=await fetchBoard({...board,provider:'oracle',token:'fixture.fa.us2.oraclecloud.com/CX_1'},async()=>Response.json({items:[{requisitionList:[{Id:123,Title:'SAP Consultant',PrimaryLocation:'Bengaluru',ShortDescriptionStr:'<p>S/4HANA consulting</p>'}]}]}));assert.equal(result.jobs[0].source.postingId,'123');assert.equal(result.jobs[0].source.publishedAt,null);assert.match(result.jobs[0].url,/CX_1\/job\/123$/);
});
test('public RSS preserves employer, regions and attribution, rejecting XML entities',async()=>{
 const rss='<rss><channel><item><title>Employer: Staff Frontend</title><link>https://weworkremotely.com/remote-jobs/employer-staff</link><region>Anywhere in the World</region><description><![CDATA[<p>Build React applications</p>]]></description><pubDate>Sat, 03 Oct 2026 00:00:00 GMT</pubDate></item></channel></rss>';
 const source={...board,provider:'weworkremotely' as const,token:'all'};const duplicated=rss.replace('</channel>',rss.match(/<item>[\s\S]*?<\/item>/)![0]+'</channel>');const result=await fetchBoard(source,async()=>new Response(duplicated));assert.equal(result.jobs.length,1);assert.equal(result.jobs[0].company,'Employer');assert.match(result.jobs[0].description,/Build React applications/);assert.equal(result.jobs[0].source.provider,'weworkremotely');await assert.rejects(fetchBoard(source,async()=>new Response('<!DOCTYPE x [<!ENTITY x SYSTEM "file:///etc/passwd">]>'+rss)),DiscoveryFailure);
});
test('SmartRecruiters paginates query scope and requires full details and pinned application URLs',async()=>{
 let details=0;const fixture={id:'smart',company:'Fixture',provider:'smartrecruiters' as const,token:'Fixture',searchText:'frontend'};
 const fetcher:typeof fetch=async(url)=>{const value=String(url);assert.match(value,/^https:\/\/api.smartrecruiters.com\/v1\/companies\/Fixture\/postings/);if(value.includes('?')){assert.match(value,/q=frontend/);return Response.json({totalFound:1,content:[{id:'123'}]});}details++;return Response.json({name:'Staff Frontend',applyUrl:'https://jobs.smartrecruiters.com/Fixture/123-staff',location:{city:'Bengaluru',country:'in'},jobAd:{sections:{jobDescription:{title:'Scope',text:'<p>Own React platform</p>'},qualifications:{text:'8 years experience'}}}});};
 const result=await fetchBoard(fixture,fetcher);assert.equal(details,1);assert.match(result.jobs[0].description,/Own React platform/);assert.match(result.jobs[0].description,/8 years experience/);assert.equal(result.jobs[0].source.postingId,'123');
 await assert.rejects(fetchBoard(fixture,async()=>Response.json({totalFound:1,content:[]})),DiscoveryFailure);
 await assert.rejects(fetchBoard(fixture,async url=>String(url).includes('?')?Response.json({totalFound:1,content:[{id:'123'}]}):new Response('',{status:429})),DiscoveryFailure);
});
