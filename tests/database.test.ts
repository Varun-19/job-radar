import { test } from 'node:test';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { createWorkspaceStore, WorkspaceConflict, InvalidMutation, createRadarService, createNotificationService, ScanBusy } from '@jobradar/services';

test('PostgreSQL persists workspace changes, versions profiles, and rejects stale writes atomically', {skip:process.env.RUN_DB_TESTS!=='1'}, async()=>{
 const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL required');
 const name=`jobradar_test_${randomUUID().replaceAll('-','')}`;
 const admin=postgres(url,{max:1});let store:ReturnType<typeof createWorkspaceStore>|undefined;
 try {
  await admin.unsafe(`CREATE DATABASE "${name}"`);
  const isolated=new URL(url);isolated.pathname=`/${name}`;
  const sql=postgres(isolated.toString(),{max:1});
  try {
   for(const migration of ['0001_workspace','0002_tracking','0003_discovery','0004_posting_history','0005_radar','0006_source_coverage','0007_evaluations','0008_recruiters','0009_alerts','0010_source_presence','0011_notifications','0012_extended_sources','0013_additional_sources'])await sql.unsafe(await readFile(new URL(`../packages/db/migrations/${migration}.sql`,import.meta.url),'utf8'));
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
   assert.equal(snapshot.postingRevisions.filter(r=>r.jobId===sourced.id).length,1);
   snapshot=await store.mutate(snapshot.revision,[{type:'create-application',application:{...input,id:randomUUID(),jobId:sourced.id}}]);
   const pinnedApplication=snapshot.applications.find(a=>a.jobId===sourced.id)!;
   const pinnedId=snapshot.postingRevisions.find(r=>r.jobId===sourced.id)!.id;
   assert.equal(pinnedApplication.postingRevisionId,pinnedId);
   const posting={company:sourced.company,title:sourced.title,location:sourced.location,description:sourced.description,url:'https://example.com/123',source:{...sourced.source,fetchedAt:new Date(Date.now()+1000).toISOString()}};
   snapshot=await store.mutate(snapshot.revision,[{type:'refresh-job',id:sourced.id,posting}]);
   assert.equal(snapshot.jobs.find(j=>j.id===sourced.id)?.alignment,'review');
   snapshot=await store.mutate(snapshot.revision,[{type:'assess-job',id:sourced.id,alignment:'primary',fit:'strong',eligibility:'confirmed'}]);
   snapshot=await store.mutate(snapshot.revision,[{type:'refresh-job',id:sourced.id,posting:{...posting,source:{...posting.source,fetchedAt:new Date(Date.now()+2000).toISOString()}}}]);
   assert.equal(snapshot.jobs.find(j=>j.id===sourced.id)?.alignment,'primary');
   assert.equal(snapshot.jobs.find(j=>j.id===sourced.id)?.fit,'strong');
   const changed={...posting,title:'Staff SAP Platform Consultant',description:'New scope',source:{...posting.source,fetchedAt:new Date(Date.now()+3000).toISOString()}};
   snapshot=await store.mutate(snapshot.revision,[{type:'refresh-job',id:sourced.id,posting:changed}]);
   const refreshed=snapshot.jobs.find(j=>j.id===sourced.id)!;
   assert.equal(refreshed.alignment,'review');assert.equal(refreshed.fit,'unknown');assert.equal(refreshed.eligibility,'unknown');
   assert.equal(refreshed.shortlisted,sourced.shortlisted);assert.equal(refreshed.profileId,sourced.profileId);
   const history=snapshot.postingRevisions.filter(r=>r.jobId===sourced.id).sort((a,b)=>a.version-b.version);
   assert.equal(history.length,4);assert.equal(history[0].snapshot.title,sourced.title);assert.equal(history[3].snapshot.title,changed.title);
   await assert.rejects(store.mutate(snapshot.revision,[{type:'refresh-job',id:sourced.id,posting:{...changed,source:{...changed.source,postingId:'wrong'}}}]),InvalidMutation);
   await assert.rejects(store.mutate(snapshot.revision,[{type:'refresh-job',id:sourced.id,posting}]),InvalidMutation);
   assert.equal((await store.read()).revision,snapshot.revision);
   assert.equal(snapshot.jobs.find(j=>j.profileId==='staff'&&j.source?.postingId==='123')?.title,sourced.title);
   assert.equal(snapshot.applications[0].resumeVersionId,resumeId);
   assert.equal(snapshot.applications.find(a=>a.id===pinnedApplication.id)?.postingRevisionId,pinnedId);

   const currentPosting=snapshot.postingRevisions.filter(r=>r.jobId===sourced.id).sort((a,b)=>b.version-a.version)[0];
   const proposal={id:randomUUID(),jobId:sourced.id,profileVersion:snapshot.profiles.find(p=>p.id===profile.id)!.version,postingRevisionId:currentPosting.id,roleFamily:'other' as const,alignment:'selective' as const,fit:'partial' as const,eligibility:'unknown' as const,levelAlignment:'calibration_required' as const,locationAlignment:'in_target' as const,staffScope:'unknown' as const,readiness:'unknown' as const,readinessNotes:'',reasoning:'Evidence supports a partial match; level and eligibility require confirmation.',postingQuotes:['New scope'],evidenceIds:[snapshot.evidence[0].id],strengths:['Migration'],gaps:[],unknowns:['Scope'],producer:'assisted_review' as const};
   await assert.rejects(store.mutate(snapshot.revision,[{type:'propose-evaluation',evaluation:{...proposal,postingQuotes:['Fabricated quote']}}]),InvalidMutation);
   await assert.rejects(store.mutate(snapshot.revision,[{type:'propose-evaluation',evaluation:{...proposal,evidenceIds:[]}}]),InvalidMutation);
   snapshot=await store.mutate(snapshot.revision,[{type:'propose-evaluation',evaluation:proposal}]);
   assert.equal(snapshot.jobs.find(j=>j.id===sourced.id)?.alignment,'review');
   assert.equal(snapshot.evaluations[0].status,'pending');
   snapshot=await store.mutate(snapshot.revision,[{type:'review-evaluation',id:proposal.id,decision:'accepted'}]);
   assert.equal(snapshot.jobs.find(j=>j.id===sourced.id)?.evaluationId,proposal.id);
   assert.equal(snapshot.jobs.find(j=>j.id===sourced.id)?.fit,'partial');
   assert.equal(snapshot.applications.find(a=>a.id===pinnedApplication.id)?.postingRevisionId,pinnedId);
   const stale={...proposal,id:randomUUID()};snapshot=await store.mutate(snapshot.revision,[{type:'propose-evaluation',evaluation:stale}]);
   snapshot=await store.mutate(snapshot.revision,[{type:'save-profile',profile:{...snapshot.profiles.find(p=>p.id===profile.id)!,name:'Changed targeting'}}]);
   assert.equal(snapshot.jobs.find(j=>j.id===sourced.id)?.evaluationId,undefined);
   assert.equal(snapshot.jobs.find(j=>j.id===sourced.id)?.fit,'unknown');
   await assert.rejects(store.mutate(snapshot.revision,[{type:'review-evaluation',id:stale.id,decision:'accepted'}]),InvalidMutation);
   snapshot=await store.mutate(snapshot.revision,[{type:'review-evaluation',id:stale.id,decision:'rejected'}]);

   const contactId=randomUUID();const contact={id:contactId,name:'Fixture recruiter',company:'Test Co',title:'Recruiter',profileUrl:'https://example.com/recruiter',sourceUrl:'https://example.com/hiring',sourceQuote:'Hiring SAP consultants',observedAt:'2026-10-03',recruitingStatus:'recruiting' as const,notes:'Fixture only',jobIds:[]};
   snapshot=await store.mutate(snapshot.revision,[{type:'save-contact',contact}]);
   await assert.rejects(store.mutate(snapshot.revision,[{type:'save-contact',contact:{...contact,id:randomUUID()}}]),InvalidMutation);
   const outreach={id:randomUUID(),contactId,jobId:null,channel:'linkedin' as const,message:'Hello, are you recruiting for SAP roles?',stage:'draft' as const,sentAt:null,followUpAt:'2026-10-05',note:''};
   snapshot=await store.mutate(snapshot.revision,[{type:'save-outreach',outreach}]);
   assert.equal(snapshot.outreach[0].jobId,null);assert.equal(snapshot.contacts[0].jobIds.length,0);
   await assert.rejects(store.mutate(snapshot.revision,[{type:'save-outreach',outreach:{...outreach,stage:'sent'}}]),InvalidMutation);
   snapshot=await store.mutate(snapshot.revision,[{type:'save-outreach',outreach:{...outreach,stage:'sent',sentAt:'2026-10-03T15:00:00Z'}}]);
   assert.equal(snapshot.outreach[0].stage,'sent');
   await assert.rejects(store.mutate(snapshot.revision,[{type:'save-outreach',outreach:{...outreach,message:'Changed delivered text',stage:'sent',sentAt:'2026-10-03T15:00:00Z'}}]),InvalidMutation);
   assert.equal(snapshot.applications.find(a=>a.id===pinnedApplication.id)?.postingRevisionId,pinnedId);

   snapshot=await store.mutate(snapshot.revision,[{type:'dismiss-alert',id:'candidate:fixture:1'}]);assert.ok(snapshot.dismissedAlerts.includes('candidate:fixture:1'));

   let mode='normal';let release:()=>void=()=>{};let entered:()=>void=()=>{};
   let fixturePosting={company:'Test Co',title:'Staff Frontend Engineer',location:'Bengaluru',url:'https://example.com/staff',description:'Own frontend architecture',source:{provider:'greenhouse' as const,board:'fixture',postingId:'radar-1',fetchedAt:new Date().toISOString(),updatedAt:null}};
   const radar=createRadarService(isolated.toString(),async()=>{if(mode==='failed')throw new Error('Fixture network failure');if(mode==='block'){entered();await new Promise<void>(resolve=>{release=resolve;});}return {jobs:mode==='absent'?[]:[fixturePosting],fetchedAt:fixturePosting.source.fetchedAt};});
   try{
    await radar.scan('fixture-board');let state=await radar.read();assert.equal(state.inbox.length,1);assert.equal(state.runs[0].newCount,1);
    await radar.scan('fixture-board');state=await radar.read();assert.equal(state.inbox[0].version,1);assert.equal(state.runs[0].changedCount,0);
    fixturePosting={...fixturePosting,description:'Own cross-team frontend platform architecture'};
    await radar.scan('fixture-board');state=await radar.read();assert.equal(state.inbox[0].version,2);assert.equal(state.runs[0].changedCount,1);
    assert.equal((await sql`SELECT * FROM source_observations`).length,2);
    mode='failed';await assert.rejects(radar.scan('fixture-board'));state=await radar.read();assert.equal(state.inbox.length,1);assert.equal(state.runs[0].status,'failed');
    mode='absent';await radar.scan('fixture-board');await radar.scan('fixture-board');state=await radar.read();assert.equal(state.inbox[0].missingCount,2);mode='failed';await assert.rejects(radar.scan('fixture-board'));assert.equal((await radar.read()).inbox[0].missingCount,2);mode='normal';await radar.scan('fixture-board');assert.equal((await radar.read()).inbox[0].missingCount,0);
    mode='block';const started=new Promise<void>(resolve=>{entered=resolve;});const running=radar.scan('fixture-board');await started;await assert.rejects(radar.scan('fixture-board'),ScanBusy);await sql`UPDATE scan_schedules SET lease_until=now()-interval '1 second' WHERE board_id='fixture-board'`;mode='normal';await radar.scan('fixture-board');release();await assert.rejects(running,ScanBusy);state=await radar.read();assert.ok(state.runs.some(r=>r.status==='failed'&&r.message==='Scan lease was replaced.'));assert.equal((await sql`SELECT * FROM source_observations`).length,2);
    mode='normal';await radar.configure({boardId:'fixture-board',enabled:true,intervalMinutes:1440});await radar.tick();state=await radar.read();assert.equal(state.schedules.find(s=>s.boardId==='fixture-board')?.enabled,true);assert.equal(state.runs[0].status,'succeeded');
    snapshot=await store.mutate(snapshot.revision,[{type:'save-profile',profile:{...snapshot.profiles.find(p=>p.id===profile.id)!,discovery:{levelTerms:['Staff'],roleTerms:['frontend'],locationTerms:['Bengaluru'],excludedTitleTerms:[]}}}]);
    assert.equal((await radar.read(profile.id)).inbox.length,1);assert.equal((await radar.read('staff')).inbox.length,0);
    const count=state.runs.length;await radar.tick();assert.equal((await radar.read()).runs.length,count);
    const directory=await mkdtemp(join(tmpdir(),'jobradar-notification-test-'));const notifications=createNotificationService(isolated.toString(),directory);try{const now=new Date();now.setUTCHours(5,0,0,0);await notifications.queue(snapshot,await radar.read(),now);await notifications.queue(snapshot,await radar.read(),now);const deliveries=await notifications.read();assert.equal(deliveries.filter(row=>row.profileId===profile.id&&row.kind==='daily').length,1);assert.deepEqual(await notifications.deliver({}),{configured:false,sent:0});assert.ok(deliveries.every(row=>row.status==='pending'));}finally{await notifications.close();await rm(directory,{recursive:true,force:true});}

   }finally{await radar.close();}
  }finally{if(store){await store.close();store=undefined;}await sql.end();}
 }finally{await admin.unsafe(`DROP DATABASE IF EXISTS "${name}"`);await admin.end();}
});
