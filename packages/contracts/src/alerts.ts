import type { WorkspaceSnapshot } from './workspace';
import type { RadarSnapshot } from './radar';
export interface WorkspaceAlert {id:string;message:string;href:string}
export function workspaceAlerts(workspace:WorkspaceSnapshot,radar:RadarSnapshot|undefined,today:string,profileId:string):WorkspaceAlert[]{
 const alerts:WorkspaceAlert[]=[];
 for(const p of workspace.evaluations.filter(e=>e.status==='pending'&&workspace.jobs.some(j=>j.id===e.jobId&&j.profileId===profileId))){const job=workspace.jobs.find(j=>j.id===p.jobId)!;alerts.push({id:`proposal:${p.id}`,message:`Analysis ready for review: ${job.company} · ${job.title}`,href:`/analysis?jobId=${p.jobId}`});}
 for(const a of workspace.applications.filter(a=>workspace.jobs.some(j=>j.id===a.jobId&&j.profileId===profileId)&&a.followUpAt&&a.followUpAt<=today&&!['accepted','rejected','withdrawn'].includes(a.stage)))alerts.push({id:`application:${a.id}:${a.followUpAt}`,message:`Application follow-up due: ${workspace.jobs.find(j=>j.id===a.jobId)?.company??'Opportunity'} · ${a.followUpAt}`,href:'/applications'});
 for(const o of workspace.outreach.filter(o=>o.stage!=='closed'&&o.followUpAt&&o.followUpAt<=today))alerts.push({id:`outreach:${o.id}:${o.followUpAt}`,message:`Outreach follow-up due: ${workspace.contacts.find(c=>c.id===o.contactId)?.name??'Contact'} · ${o.followUpAt}`,href:'/recruiters'});
 if(radar){
  const seen=new Set<string>();for(const run of radar.runs){if(seen.has(run.boardId))continue;seen.add(run.boardId);if(run.status==='failed')alerts.push({id:`scan:${run.id}`,message:`Scan failed: ${workspace.boards.find(b=>b.id===run.boardId)?.company??run.boardId}. Review the scan history.`,href:'/discovery'});}
  for(const item of radar.inbox){const posting=item.posting;const saved=workspace.jobs.find(j=>j.profileId===profileId&&j.source?.provider===posting.source.provider&&j.source.board===posting.source.board&&j.source.postingId===posting.source.postingId);if(!saved||saved.description!==posting.description||saved.title!==posting.title||saved.location!==posting.location)alerts.push({id:`candidate:${profileId}:${item.id}:${item.version}`,message:`${saved?'Changed posting':'New candidate'}: ${posting.company} · ${posting.title}`,href:'/discovery'});}
 }
 return alerts.filter(a=>!workspace.dismissedAlerts.includes(a.id));
}
