import { randomUUID, createHash } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { createDatabase } from '@jobradar/db';
import { workspaceMeta, profiles, profileVersions, preferences, jobs, activities, resumes, evidence, applications, boards, postingRevisions, evaluations, contacts, outreach, alertDismissals } from '@jobradar/db/schema';
import { requiresCorrectionNote, sameSource, postingContentChanged } from '@jobradar/domain';
import { initialProfiles, workspaceSchema, type WorkspaceSnapshot, type WorkspaceMutation } from '@jobradar/contracts';
export interface WorkspaceStore { read():Promise<WorkspaceSnapshot>; mutate(revision:number,mutations:WorkspaceMutation[]):Promise<WorkspaceSnapshot>; close():Promise<void>; resumeFile?(id:string):Promise<{metadata:WorkspaceSnapshot['resumes'][number];base64:string}|undefined> }
export class WorkspaceConflict extends Error {}
export class InvalidMutation extends Error {}
export function createWorkspaceStore(url:string):WorkspaceStore {
 const connection=createDatabase(url); const db=connection.db;
 async function seed() { await db.transaction(async tx => { await tx.select().from(workspaceMeta).where(eq(workspaceMeta.id,1)).for('update'); for(const config of initialProfiles) { const result=await tx.insert(profiles).values({id:config.id,config}).onConflictDoNothing().returning(); if(result.length)await tx.insert(profileVersions).values({profileId:config.id,version:1,config}); } }); }
 let seeded:Promise<void>|undefined;
 async function read() { await (seeded ??= seed().catch(e=>{seeded=undefined;throw e;})); return db.transaction(async tx => {
  await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ`);
  const [meta] = await tx.select().from(workspaceMeta).where(eq(workspaceMeta.id,1));
  const dismissed=await tx.select().from(alertDismissals);
  const contactRows=await tx.select().from(contacts);const outreachRows=await tx.select().from(outreach);
  const evaluationRows=await tx.select().from(evaluations);
  const revisionRows=await tx.select().from(postingRevisions);
  const boardRows=await tx.select().from(boards);
  const profileRows=await tx.select().from(profiles); const jobRows=await tx.select().from(jobs); const tierRows=await tx.select().from(preferences);
  const resumeRows=await tx.select({metadata:resumes.metadata}).from(resumes);const evidenceRows=await tx.select().from(evidence);const applicationRows=await tx.select().from(applications);const activityRows=await tx.select().from(activities).orderBy(activities.revision,activities.createdAt);
  const tiers:WorkspaceSnapshot['tiers']={};for(const row of tierRows){(tiers[row.profileId]??={})[row.company]=row.tier as WorkspaceSnapshot['tiers'][string][string];}
  return workspaceSchema.parse({revision:meta.revision,dismissedAlerts:dismissed.map(r=>r.id),contacts:contactRows.map(r=>r.data),outreach:outreachRows.map(r=>r.data),evaluations:evaluationRows.map(r=>r.data),postingRevisions:revisionRows.map(r=>r.data),boards:boardRows.map(r=>r.data),profiles:profileRows.map(r=>r.config).sort((a,b)=>a.id.localeCompare(b.id)),jobs:jobRows.map(r=>r.data),tiers,resumes:resumeRows.map(r=>r.metadata),evidence:evidenceRows.map(r=>r.data),applications:applicationRows.map(r=>r.data),activities:activityRows.map(r=>({...r,createdAt:r.createdAt.toISOString()}))});
 }); }
 return {read,close:connection.close,async resumeFile(id){const [row]=await db.select().from(resumes).where(eq(resumes.id,id));return row?{metadata:row.metadata,base64:row.originalBase64}:undefined;}, async mutate(revision,mutations) {
  await read();
  await db.transaction(async tx => {
   const [meta]=await tx.select().from(workspaceMeta).where(eq(workspaceMeta.id,1)).for('update');
   if(meta.revision!==revision)throw new WorkspaceConflict('Workspace changed. Reload and retry.');
   for(const mutation of mutations){
    if(mutation.type==='dismiss-alert'){await tx.insert(alertDismissals).values({id:mutation.id}).onConflictDoNothing();
    }else if(mutation.type==='save-contact'){
     const input=mutation.contact;for(const id of input.jobIds){const [job]=await tx.select().from(jobs).where(eq(jobs.id,id));if(!job)throw new InvalidMutation('Contact association references an unknown opportunity.');}
     const [existing]=await tx.select().from(contacts).where(eq(contacts.id,input.id));
     const all=await tx.select().from(contacts);if(all.some(c=>c.id!==input.id&&c.data.profileUrl.replace(/\/$/,'')===input.profileUrl.replace(/\/$/,'')))throw new InvalidMutation('This recruiter profile is already saved.');
     const now=new Date().toISOString();await tx.insert(contacts).values({id:input.id,data:{...input,createdAt:existing?.data.createdAt??now,updatedAt:now}}).onConflictDoUpdate({target:contacts.id,set:{data:{...input,createdAt:existing?.data.createdAt??now,updatedAt:now}}});
    }else if(mutation.type==='save-outreach'){
     const input=mutation.outreach;const [contact]=await tx.select().from(contacts).where(eq(contacts.id,input.contactId));if(!contact)throw new InvalidMutation('Unknown recruiter.');
     if(input.jobId){const [job]=await tx.select().from(jobs).where(eq(jobs.id,input.jobId));if(!job)throw new InvalidMutation('Unknown outreach opportunity.');}
     const [existing]=await tx.select().from(outreach).where(eq(outreach.id,input.id));
     if(input.stage==='draft'&&input.sentAt)throw new InvalidMutation('A draft cannot have a sent date.');
     if(['sent','replied'].includes(input.stage)&&!input.sentAt)throw new InvalidMutation('Record the actual sent date for delivered outreach.');
     if(existing&&existing.data.stage!=='draft'&&(existing.data.contactId!==input.contactId||existing.data.message!==input.message||existing.data.sentAt!==input.sentAt||input.stage==='draft')&&!input.note.trim())throw new InvalidMutation('Explain corrections to delivered outreach.');
     const now=new Date().toISOString();const data={...input,createdAt:existing?.data.createdAt??now,updatedAt:now};await tx.insert(outreach).values({id:input.id,contactId:input.contactId,jobId:input.jobId,data}).onConflictDoUpdate({target:outreach.id,set:{contactId:input.contactId,jobId:input.jobId,data}});
    }else if(mutation.type==='propose-evaluation'){
     const input=mutation.evaluation;const [job]=await tx.select().from(jobs).where(eq(jobs.id,input.jobId));if(!job)throw new InvalidMutation('Unknown opportunity.');
     const [profile]=await tx.select().from(profiles).where(eq(profiles.id,job.profileId));if(profile.config.version!==input.profileVersion)throw new InvalidMutation('Analysis uses a stale profile version.');
     const history=await tx.select().from(postingRevisions).where(eq(postingRevisions.jobId,job.id));const current=history.sort((a,b)=>b.version-a.version)[0];if((current?.id??null)!==input.postingRevisionId)throw new InvalidMutation('Analysis uses a stale posting version.');
     const normalize=(value:string)=>value.replace(/\s+/g,' ').trim();const text=normalize(`${job.data.title}\n${job.data.location}\n${job.data.description}`);
     if(input.postingQuotes.some(quote=>!text.includes(normalize(quote))))throw new InvalidMutation('An analysis quote was not found in the source posting.');
     for(const id of input.evidenceIds){const [item]=await tx.select().from(evidence).where(eq(evidence.id,id));if(!item)throw new InvalidMutation('Analysis references unknown professional evidence.');}
     if(input.fit!=='unknown'&&!input.evidenceIds.length)throw new InvalidMutation('Professional fit requires reviewed evidence; otherwise keep it unknown.');
     if(input.readiness!=='unknown'&&!input.readinessNotes.trim())throw new InvalidMutation('Readiness requires explicit preparation evidence.');
     const [duplicate]=await tx.select().from(evaluations).where(eq(evaluations.id,input.id));if(duplicate)throw new InvalidMutation('Analysis proposal already exists.');
     await tx.insert(evaluations).values({id:input.id,jobId:input.jobId,data:{...input,status:'pending',createdAt:new Date().toISOString(),reviewedAt:null}});
    }else if(mutation.type==='review-evaluation'){
     const [proposal]=await tx.select().from(evaluations).where(eq(evaluations.id,mutation.id));if(!proposal||proposal.data.status!=='pending')throw new InvalidMutation('Choose a pending analysis proposal.');
     if(mutation.decision==='accepted'){
      const [job]=await tx.select().from(jobs).where(eq(jobs.id,proposal.jobId));const [profile]=await tx.select().from(profiles).where(eq(profiles.id,job.profileId));
      const history=await tx.select().from(postingRevisions).where(eq(postingRevisions.jobId,job.id));const current=history.sort((a,b)=>b.version-a.version)[0];
      if(profile.config.version!==proposal.data.profileVersion||(current?.id??null)!==proposal.data.postingRevisionId)throw new InvalidMutation('The profile or posting changed. Request a fresh analysis.');
      const {alignment,fit,eligibility}=proposal.data;await tx.update(jobs).set({data:{...job.data,alignment,fit,eligibility,evaluationId:proposal.id}}).where(eq(jobs.id,job.id));
     }
     await tx.update(evaluations).set({data:{...proposal.data,status:mutation.decision,reviewedAt:new Date().toISOString()}}).where(eq(evaluations.id,proposal.id));
    }else if(mutation.type==='refresh-job'){
     const [job]=await tx.select().from(jobs).where(eq(jobs.id,mutation.id));if(!job)throw new InvalidMutation('Unknown job.');
     if(!sameSource(job.data.source,mutation.posting.source))throw new InvalidMutation('Refresh must reference the same source posting.');
     if(mutation.posting.source.fetchedAt<job.data.source!.fetchedAt)throw new InvalidMutation('This snapshot is older than the saved posting. Fetch the board again.');
     const changed=postingContentChanged(job.data,mutation.posting);
     const data={...job.data,...mutation.posting,...(changed?{alignment:'review' as const,fit:'unknown' as const,eligibility:'unknown' as const,evaluationId:undefined}:{})};
     const history=await tx.select().from(postingRevisions).where(eq(postingRevisions.jobId,job.id));
     const version=Math.max(0,...history.map(r=>r.version))+1;const id=randomUUID();
     await tx.insert(postingRevisions).values({id,jobId:job.id,version,data:{id,jobId:job.id,version,capturedAt:mutation.posting.source.fetchedAt,snapshot:data}});
     await tx.update(jobs).set({data}).where(eq(jobs.id,job.id));
    }else if(mutation.type==='save-board'){
     await tx.insert(boards).values({id:mutation.board.id,data:mutation.board}).onConflictDoUpdate({target:boards.id,set:{data:mutation.board}});
    }else if(mutation.type==='assess-job'){
     const [job]=await tx.select().from(jobs).where(eq(jobs.id,mutation.id));if(!job)throw new InvalidMutation('Unknown job.');
     await tx.update(jobs).set({data:{...job.data,alignment:mutation.alignment,fit:mutation.fit,eligibility:mutation.eligibility,evaluationId:undefined}}).where(eq(jobs.id,mutation.id));
    }else if(mutation.type==='save-profile') {
     const [existing]=await tx.select().from(profiles).where(eq(profiles.id,mutation.profile.id));
     if(existing && mutation.profile.version !== existing.config.version)throw new WorkspaceConflict('Profile changed. Reload and retry.');
     if(!existing && mutation.profile.version!==1)throw new InvalidMutation('New profiles start at version 1.');
     const config={...mutation.profile,version:existing?existing.config.version+1:1};
     await tx.insert(profiles).values({id:config.id,config}).onConflictDoUpdate({target:profiles.id,set:{config}});
     await tx.insert(profileVersions).values({profileId:config.id,version:config.version,config});
     if(existing){const affected=await tx.select().from(jobs).where(eq(jobs.profileId,config.id));for(const row of affected)await tx.update(jobs).set({data:{...row.data,evaluationId:undefined,alignment:'review',fit:'unknown',eligibility:'unknown'}}).where(eq(jobs.id,row.id));}
    } else if(mutation.type==='add-job') {
     const [profile]=await tx.select().from(profiles).where(eq(profiles.id,mutation.job.profileId));if(!profile)throw new InvalidMutation('Unknown search profile.');
     const [existing]=await tx.select().from(jobs).where(eq(jobs.id,mutation.job.id));if(existing)throw new InvalidMutation('Draft already exists.');
     if(mutation.job.source){const all=await tx.select().from(jobs).where(eq(jobs.profileId,mutation.job.profileId));if(all.some(r=>r.data.source?.provider===mutation.job.source!.provider&&r.data.source?.board===mutation.job.source!.board&&r.data.source?.postingId===mutation.job.source!.postingId))throw new InvalidMutation('This source posting is already saved for this profile.');}
     await tx.insert(jobs).values({id:mutation.job.id,profileId:mutation.job.profileId,data:mutation.job});
     if(mutation.job.source){const id=randomUUID();await tx.insert(postingRevisions).values({id,jobId:mutation.job.id,version:1,data:{id,jobId:mutation.job.id,version:1,capturedAt:mutation.job.source.fetchedAt,snapshot:mutation.job}});}
    } else if(mutation.type==='shortlist') {
     const [job]=await tx.select().from(jobs).where(eq(jobs.id,mutation.id));if(!job)throw new InvalidMutation('Unknown job.');
     await tx.update(jobs).set({data:{...job.data,shortlisted:mutation.shortlisted}}).where(eq(jobs.id,mutation.id));
    } else if(mutation.type==='add-resume') {
     const existing=await tx.select().from(resumes).where(eq(resumes.seriesKey,mutation.label.toLowerCase()));
     const [duplicate]=await tx.select().from(resumes).where(eq(resumes.id,mutation.id));if(duplicate)throw new InvalidMutation('Résumé version already exists.');
     const version=Math.max(0,...existing.map(r=>r.version))+1;
     const bytes=mutation.originalBase64 ? Buffer.from(mutation.originalBase64,'base64') : Buffer.from(mutation.text,'utf8');
     if(bytes.length>4*1024*1024)throw new InvalidMutation('Résumé exceeds the 4 MB limit.');
     if(mutation.mediaType==='application/pdf' && (!mutation.originalBase64 || bytes.subarray(0,5).toString()!=='%PDF-'))throw new InvalidMutation('Invalid PDF file.');
     const metadata={id:mutation.id,label:mutation.label,version,filename:mutation.filename,mediaType:mutation.mediaType,text:mutation.text,sha256:createHash('sha256').update(bytes).digest('hex'),createdAt:new Date().toISOString()};
     await tx.insert(resumes).values({id:mutation.id,seriesKey:mutation.label.toLowerCase(),version,metadata,originalBase64:bytes.toString('base64')});
    } else if(mutation.type==='add-evidence') {
     const item=mutation.evidence;
     const [duplicate]=await tx.select().from(evidence).where(eq(evidence.id,item.id));if(duplicate)throw new InvalidMutation('Evidence already exists.');
     if(item.source==='resume'){
      if(!item.resumeVersionId || !item.quote.trim())throw new InvalidMutation('Résumé evidence requires a version and supporting quote.');
      const [resume]=await tx.select().from(resumes).where(eq(resumes.id,item.resumeVersionId));if(!resume)throw new InvalidMutation('Unknown résumé version.');
      const normalize=(text:string)=>text.replace(/\s+/g,' ').trim();
      if(!normalize(resume.metadata.text).includes(normalize(item.quote)))throw new InvalidMutation('Supporting quote was not found in that résumé.');
     }else if(item.resumeVersionId)throw new InvalidMutation('Only résumé evidence can reference a résumé version.');
     await tx.insert(evidence).values({id:item.id,resumeVersionId:item.resumeVersionId,data:{...item,createdAt:new Date().toISOString()}});
    } else if(mutation.type==='create-application' || mutation.type==='update-application') {
     const input=mutation.type==='create-application'?mutation.application:mutation;
     const [existing]=await tx.select().from(applications).where(eq(applications.id,input.id));
     if(mutation.type==='update-application' && !existing)throw new InvalidMutation('Unknown application.');
     if(mutation.type==='create-application') {
      if(existing)throw new InvalidMutation('Application already exists.');
      const [job]=await tx.select().from(jobs).where(eq(jobs.id,mutation.application.jobId));if(!job)throw new InvalidMutation('Unknown job.');
      const [duplicate]=await tx.select().from(applications).where(eq(applications.jobId,mutation.application.jobId));if(duplicate)throw new InvalidMutation('This job already has an application.');
     }
     if(input.resumeVersionId){const [resume]=await tx.select().from(resumes).where(eq(resumes.id,input.resumeVersionId));if(!resume)throw new InvalidMutation('Unknown résumé version.');}
     if(existing && requiresCorrectionNote(existing.data.stage,input.stage,existing.data.resumeVersionId!==input.resumeVersionId || existing.data.submittedAt!==input.submittedAt) && !input.note.trim())throw new InvalidMutation('Add an explanation when correcting a stage, reopening an application, or changing the résumé used after submission.');
     const now=new Date().toISOString();
     const jobId=mutation.type==='create-application'?mutation.application.jobId:existing!.jobId;
     const submittedAt=input.submittedAt;
     const postingHistory=mutation.type==='create-application'?await tx.select().from(postingRevisions).where(eq(postingRevisions.jobId,jobId)):[];
     const postingRevisionId=existing?.data.postingRevisionId??(mutation.type==='create-application'?postingHistory.sort((a,b)=>b.version-a.version)[0]?.id??null:null);
     const data={id:input.id,jobId,stage:input.stage,resumeVersionId:input.resumeVersionId,followUpAt:input.followUpAt,createdAt:existing?.data.createdAt??now,updatedAt:now,submittedAt,postingRevisionId};
     await tx.insert(applications).values({id:input.id,jobId,resumeVersionId:input.resumeVersionId,data}).onConflictDoUpdate({target:applications.id,set:{resumeVersionId:input.resumeVersionId,data}});
    } else {
     const [profile]=await tx.select().from(profiles).where(eq(profiles.id,mutation.profileId));if(!profile)throw new InvalidMutation('Unknown search profile.');
     const company=mutation.company.trim().toLowerCase();await tx.insert(preferences).values({profileId:mutation.profileId,company,tier:mutation.tier}).onConflictDoUpdate({target:[preferences.profileId,preferences.company],set:{tier:mutation.tier}});
    }
    await tx.insert(activities).values({id:randomUUID(),revision:revision+1,type:mutation.type,data:mutation.type==='add-resume'?{type:mutation.type,resumeVersionId:mutation.id,label:mutation.label}:mutation});
   }
   await tx.update(workspaceMeta).set({revision:revision+1}).where(eq(workspaceMeta.id,1));
  });return read();
 }};
}
export * from './radar';

export * from './review-packet';
export * from './notifications';
