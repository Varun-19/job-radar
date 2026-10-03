import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { createDatabase } from '@jobradar/db';
import { workspaceMeta, profiles, profileVersions, preferences, jobs, activities } from '@jobradar/db/schema';
import { initialProfiles, workspaceSchema, type WorkspaceSnapshot, type WorkspaceMutation } from '@jobradar/contracts';
export interface WorkspaceStore { read():Promise<WorkspaceSnapshot>; mutate(revision:number,mutations:WorkspaceMutation[]):Promise<WorkspaceSnapshot>; close():Promise<void> }
export class WorkspaceConflict extends Error {}
export class InvalidMutation extends Error {}
export function createWorkspaceStore(url:string):WorkspaceStore {
 const connection=createDatabase(url); const db=connection.db;
 async function seed() { await db.transaction(async tx => { await tx.select().from(workspaceMeta).where(eq(workspaceMeta.id,1)).for('update'); for(const config of initialProfiles) { const result=await tx.insert(profiles).values({id:config.id,config}).onConflictDoNothing().returning(); if(result.length)await tx.insert(profileVersions).values({profileId:config.id,version:1,config}); } }); }
 let seeded:Promise<void>|undefined;
 async function read() { await (seeded ??= seed().catch(e=>{seeded=undefined;throw e;})); return db.transaction(async tx => {
  await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ`);
  const [meta] = await tx.select().from(workspaceMeta).where(eq(workspaceMeta.id,1));
  const profileRows=await tx.select().from(profiles); const jobRows=await tx.select().from(jobs); const tierRows=await tx.select().from(preferences);
  const tiers:WorkspaceSnapshot['tiers']={};for(const row of tierRows){(tiers[row.profileId]??={})[row.company]=row.tier as WorkspaceSnapshot['tiers'][string][string];}
  return workspaceSchema.parse({revision:meta.revision,profiles:profileRows.map(r=>r.config).sort((a,b)=>a.id.localeCompare(b.id)),jobs:jobRows.map(r=>r.data),tiers});
 }); }
 return {read,close:connection.close, async mutate(revision,mutations) {
  await read();
  await db.transaction(async tx => {
   const [meta]=await tx.select().from(workspaceMeta).where(eq(workspaceMeta.id,1)).for('update');
   if(meta.revision!==revision)throw new WorkspaceConflict('Workspace changed. Reload and retry.');
   for(const mutation of mutations){
    if(mutation.type==='save-profile') {
     const [existing]=await tx.select().from(profiles).where(eq(profiles.id,mutation.profile.id));
     if(existing && mutation.profile.version !== existing.config.version)throw new WorkspaceConflict('Profile changed. Reload and retry.');
     if(!existing && mutation.profile.version!==1)throw new InvalidMutation('New profiles start at version 1.');
     const config={...mutation.profile,version:existing?existing.config.version+1:1};
     await tx.insert(profiles).values({id:config.id,config}).onConflictDoUpdate({target:profiles.id,set:{config}});
     await tx.insert(profileVersions).values({profileId:config.id,version:config.version,config});
    } else if(mutation.type==='add-job') {
     const [profile]=await tx.select().from(profiles).where(eq(profiles.id,mutation.job.profileId));if(!profile)throw new InvalidMutation('Unknown search profile.');
     const [existing]=await tx.select().from(jobs).where(eq(jobs.id,mutation.job.id));if(existing)throw new InvalidMutation('Draft already exists.');
     await tx.insert(jobs).values({id:mutation.job.id,profileId:mutation.job.profileId,data:mutation.job});
    } else if(mutation.type==='shortlist') {
     const [job]=await tx.select().from(jobs).where(eq(jobs.id,mutation.id));if(!job)throw new InvalidMutation('Unknown job.');
     await tx.update(jobs).set({data:{...job.data,shortlisted:mutation.shortlisted}}).where(eq(jobs.id,mutation.id));
    } else {
     const [profile]=await tx.select().from(profiles).where(eq(profiles.id,mutation.profileId));if(!profile)throw new InvalidMutation('Unknown search profile.');
     const company=mutation.company.trim().toLowerCase();await tx.insert(preferences).values({profileId:mutation.profileId,company,tier:mutation.tier}).onConflictDoUpdate({target:[preferences.profileId,preferences.company],set:{tier:mutation.tier}});
    }
    await tx.insert(activities).values({id:randomUUID(),revision:revision+1,type:mutation.type,data:mutation});
   }
   await tx.update(workspaceMeta).set({revision:revision+1}).where(eq(workspaceMeta.id,1));
  });return read();
 }};
}
