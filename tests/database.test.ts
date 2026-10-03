import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { createWorkspaceStore, WorkspaceConflict, InvalidMutation } from '@jobradar/services';

test('PostgreSQL persists workspace changes, versions profiles, and rejects stale writes atomically', {skip:process.env.RUN_DB_TESTS!=='1'}, async()=>{
 const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL required');
 const name=`jobradar_test_${randomUUID().replaceAll('-','')}`;
 const admin=postgres(url,{max:1});let store:ReturnType<typeof createWorkspaceStore>|undefined;
 try {
  await admin.unsafe(`CREATE DATABASE "${name}"`);
  const isolated=new URL(url);isolated.pathname=`/${name}`;
  const sql=postgres(isolated.toString(),{max:1});
  try {
   for(const migration of ['0001_workspace','0002_tracking','0003_discovery'])await sql.unsafe(await readFile(new URL(`../packages/db/migrations/${migration}.sql`,import.meta.url),'utf8'));
   store=createWorkspaceStore(isolated.toString());let snapshot=await store.read();assert.equal(snapshot.profiles.length,2);
   const profile={id:'test-profile',name:'SAP integration',version:1,roleFamilies:['SAP integrations'],levels:[],locations:['India'],keywords:[],exclusions:[]};
   snapshot=await store.mutate(snapshot.revision,[{type:'save-profile',profile}]);
   const oldRevision=snapshot.revision;
   snapshot=await store.mutate(snapshot.revision,[{type:'save-profile',profile:{...profile,name:'SAP integration revised'}}]);
   assert.equal(snapshot.profiles.find(p=>p.id===profile.id)?.version,2);
   assert.equal((await sql`SELECT * FROM search_profile_versions WHERE profile_id = ${profile.id}`).length,2);
   const job={id:randomUUID(),profileId:profile.id,company:'Test Co',title:'Consultant',location:'India',url:'',description:'Test fixture',alignment:'primary' as const,fit:'unknown' as const,eligibility:'confirmed' as const,createdAt:new Date().toISOString(),shortlisted:false};
   snapshot=await store.mutate(snapshot.revision,[{type:'add-job',job},{type:'set-tier',profileId:profile.id,company:' Test Co ',tier:'strategic-target'}]);
   assert.equal(snapshot.tiers[profile.id]['test co'],'strategic-target');
   await assert.rejects(store.mutate(oldRevision,[{type:'shortlist',id:job.id,shortlisted:true}]),WorkspaceConflict);
   assert.equal((await store.read()).jobs[0].shortlisted,false);
   const revision=snapshot.revision;
   await assert.rejects(store.mutate(revision,[{type:'shortlist',id:job.id,shortlisted:true},{type:'add-job',job}]),InvalidMutation);
   snapshot=await store.read();assert.equal(snapshot.revision,revision);assert.equal(snapshot.jobs[0].shortlisted,false);
   snapshot=await store.mutate(snapshot.revision,[{type:'shortlist',id:job.id,shortlisted:true}]);
   await store.close();store=createWorkspaceStore(isolated.toString());snapshot=await store.read();assert.equal(snapshot.jobs[0].shortlisted,true);
   assert.equal((await sql`SELECT * FROM workspace_activities`).length,5);
   const resumeId=randomUUID();
   snapshot=await store.mutate(snapshot.revision,[{type:'add-resume',id:resumeId,label:'Staff resume',filename:'resume.txt',mediaType:'text/plain',text:'Led a frontend platform migration.'}]);
   snapshot=await store.mutate(snapshot.revision,[{type:'add-resume',id:randomUUID(),label:'Staff resume',filename:'resume-v2.txt',mediaType:'text/plain',text:'Led a frontend platform migration. Improved reliability.'}]);
   assert.deepEqual(snapshot.resumes.map(r=>r.version).sort(),[1,2]);
   const invalidEvidence={id:randomUUID(),capability:'GraphQL',category:'Frontend',description:'Unsupported claim',strength:'deep' as const,source:'resume' as const,resumeVersionId:resumeId,quote:'Built GraphQL federation',reference:''};
   await assert.rejects(store.mutate(snapshot.revision,[{type:'add-evidence',evidence:invalidEvidence}]),InvalidMutation);
   snapshot=await store.mutate(snapshot.revision,[{type:'add-evidence',evidence:{...invalidEvidence,capability:'Platform migration',description:'Led migration',strength:'strong',quote:'Led a frontend platform migration.'}}]);
   assert.equal(snapshot.evidence.length,1);
   const appId=randomUUID();
   const input={id:appId,jobId:job.id,stage:'applied' as const,resumeVersionId:resumeId,followUpAt:'2026-10-10',submittedAt:null,note:'Historical application; submission date unknown'};
   snapshot=await store.mutate(snapshot.revision,[{type:'create-application',application:input}]);
   assert.equal(snapshot.applications[0].submittedAt,null);
   await assert.rejects(store.mutate(snapshot.revision,[{type:'create-application',application:{...input,id:randomUUID()}}]),InvalidMutation);
   const revisionBeforeCorrection=snapshot.revision;
   await assert.rejects(store.mutate(snapshot.revision,[{type:'update-application',id:appId,stage:'preparing',resumeVersionId:resumeId,followUpAt:null,submittedAt:null,note:''}]),InvalidMutation);
   assert.equal((await store.read()).revision,revisionBeforeCorrection);
   snapshot=await store.mutate(snapshot.revision,[{type:'update-application',id:appId,stage:'recruiter',resumeVersionId:resumeId,followUpAt:null,submittedAt:null,note:'Recruiter replied'}]);
   assert.equal(snapshot.applications[0].resumeVersionId,resumeId);
   assert.equal(snapshot.activities.filter(a=>a.type==='create-application'||a.type==='update-application').length,2);
   assert.equal((await store.resumeFile!(resumeId))?.base64,Buffer.from('Led a frontend platform migration.').toString('base64'));

   snapshot=await store.mutate(snapshot.revision,[{type:'save-board',board:{id:'fixture-board',company:'Test Co',provider:'greenhouse',token:'fixture'}}]);
   assert.equal(snapshot.boards.find(b=>b.id==='fixture-board')?.token,'fixture');
   const sourced={...job,id:randomUUID(),alignment:'review' as const,eligibility:'unknown' as const,source:{provider:'greenhouse' as const,board:'fixture',postingId:'123',fetchedAt:new Date().toISOString(),updatedAt:null}};
   snapshot=await store.mutate(snapshot.revision,[{type:'add-job',job:sourced}]);
   await assert.rejects(store.mutate(snapshot.revision,[{type:'add-job',job:{...sourced,id:randomUUID()}}]),InvalidMutation);
   snapshot=await store.mutate(snapshot.revision,[{type:'add-job',job:{...sourced,id:randomUUID(),profileId:'staff'}}]);
   snapshot=await store.mutate(snapshot.revision,[{type:'assess-job',id:sourced.id,alignment:'primary',fit:'partial',eligibility:'confirmed'}]);
   assert.equal(snapshot.jobs.find(j=>j.id===sourced.id)?.source?.postingId,'123');
   assert.equal(snapshot.jobs.find(j=>j.id===sourced.id)?.alignment,'primary');
   assert.equal(snapshot.activities.filter(a=>a.type==='assess-job').length,1);
  }finally{if(store){await store.close();store=undefined;}await sql.end();}
 }finally{await admin.unsafe(`DROP DATABASE IF EXISTS "${name}"`);await admin.end();}
});
