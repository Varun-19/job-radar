import { randomUUID, createHash } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { createDatabase } from '@jobradar/db';
import { workspaceMeta, profiles, profileVersions, preferences, jobs, activities, resumes, evidence, applications, boards } from '@jobradar/db/schema';
import { requiresCorrectionNote } from '@jobradar/domain';
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
  const boardRows=await tx.select().from(boards);
  const profileRows=await tx.select().from(profiles); const jobRows=await tx.select().from(jobs); const tierRows=await tx.select().from(preferences);
  const resumeRows=await tx.select({metadata:resumes.metadata}).from(resumes);const evidenceRows=await tx.select().from(evidence);const applicationRows=await tx.select().from(applications);const activityRows=await tx.select().from(activities).orderBy(activities.revision,activities.createdAt);
  const tiers:WorkspaceSnapshot['tiers']={};for(const row of tierRows){(tiers[row.profileId]??={})[row.company]=row.tier as WorkspaceSnapshot['tiers'][string][string];}
  return workspaceSchema.parse({revision:meta.revision,boards:boardRows.map(r=>r.data),profiles:profileRows.map(r=>r.config).sort((a,b)=>a.id.localeCompare(b.id)),jobs:jobRows.map(r=>r.data),tiers,resumes:resumeRows.map(r=>r.metadata),evidence:evidenceRows.map(r=>r.data),applications:applicationRows.map(r=>r.data),activities:activityRows.map(r=>({...r,createdAt:r.createdAt.toISOString()}))});
 }); }
 return {read,close:connection.close,async resumeFile(id){const [row]=await db.select().from(resumes).where(eq(resumes.id,id));return row?{metadata:row.metadata,base64:row.originalBase64}:undefined;}, async mutate(revision,mutations) {
  await read();
  await db.transaction(async tx => {
   const [meta]=await tx.select().from(workspaceMeta).where(eq(workspaceMeta.id,1)).for('update');
   if(meta.revision!==revision)throw new WorkspaceConflict('Workspace changed. Reload and retry.');
   for(const mutation of mutations){
    if(mutation.type==='save-board'){
     await tx.insert(boards).values({id:mutation.board.id,data:mutation.board}).onConflictDoUpdate({target:boards.id,set:{data:mutation.board}});
    }else if(mutation.type==='assess-job'){
     const [job]=await tx.select().from(jobs).where(eq(jobs.id,mutation.id));if(!job)throw new InvalidMutation('Unknown job.');
     await tx.update(jobs).set({data:{...job.data,alignment:mutation.alignment,fit:mutation.fit,eligibility:mutation.eligibility}}).where(eq(jobs.id,mutation.id));
    }else if(mutation.type==='save-profile') {
     const [existing]=await tx.select().from(profiles).where(eq(profiles.id,mutation.profile.id));
     if(existing && mutation.profile.version !== existing.config.version)throw new WorkspaceConflict('Profile changed. Reload and retry.');
     if(!existing && mutation.profile.version!==1)throw new InvalidMutation('New profiles start at version 1.');
     const config={...mutation.profile,version:existing?existing.config.version+1:1};
     await tx.insert(profiles).values({id:config.id,config}).onConflictDoUpdate({target:profiles.id,set:{config}});
     await tx.insert(profileVersions).values({profileId:config.id,version:config.version,config});
    } else if(mutation.type==='add-job') {
     const [profile]=await tx.select().from(profiles).where(eq(profiles.id,mutation.job.profileId));if(!profile)throw new InvalidMutation('Unknown search profile.');
     const [existing]=await tx.select().from(jobs).where(eq(jobs.id,mutation.job.id));if(existing)throw new InvalidMutation('Draft already exists.');
     if(mutation.job.source){const all=await tx.select().from(jobs).where(eq(jobs.profileId,mutation.job.profileId));if(all.some(r=>r.data.source?.provider===mutation.job.source!.provider&&r.data.source?.board===mutation.job.source!.board&&r.data.source?.postingId===mutation.job.source!.postingId))throw new InvalidMutation('This source posting is already saved for this profile.');}
     await tx.insert(jobs).values({id:mutation.job.id,profileId:mutation.job.profileId,data:mutation.job});
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
     const data={id:input.id,jobId,stage:input.stage,resumeVersionId:input.resumeVersionId,followUpAt:input.followUpAt,createdAt:existing?.data.createdAt??now,updatedAt:now,submittedAt};
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
