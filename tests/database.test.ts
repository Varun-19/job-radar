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
   await sql.unsafe(await readFile(new URL('../packages/db/migrations/0001_workspace.sql',import.meta.url),'utf8'));
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
  }finally{if(store){await store.close();store=undefined;}await sql.end();}
 }finally{await admin.unsafe(`DROP DATABASE IF EXISTS "${name}"`);await admin.end();}
});
