import {companyTier} from './company-universe';
import {candidateSignals} from './discovery-filter';
import {remoteRegion} from './resume-review';
import type {WorkspaceSnapshot,RadarSnapshot} from '@jobradar/contracts';
export function digestPeriod(now:Date,kind:'daily'|'weekly'){
 const day=now.toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
 if(kind==='daily')return day;
 const local=new Date(day+'T00:00:00Z');const offset=(local.getUTCDay()+6)%7;local.setUTCDate(local.getUTCDate()-offset);return local.toISOString().slice(0,10);
}
export function buildDigest(workspace:WorkspaceSnapshot,radar:RadarSnapshot,profileId:string,kind:'daily'|'weekly',now=new Date()){
 const profile=workspace.profiles.find(p=>p.id===profileId);if(!profile?.discovery)return null;
 const priority=(company:string)=>({'strategic-target':0,target:1,watch:2,opportunistic:3,unclassified:4,excluded:5})[companyTier(workspace.tiers[profileId],company)];
 const cutoff=now.getTime()-(kind==='daily'?24:7*24)*3600000;
 const candidates=radar.inbox.filter(row=>row.missingCount===0&&Date.parse(row.changedAt)>=cutoff&&candidateSignals(row.posting,profile.discovery!).candidate&&priority(row.posting.company)!==5).sort((a,b)=>priority(a.posting.company)-priority(b.posting.company)||b.changedAt.localeCompare(a.changedAt));
 const seen=new Set<string>();const unique=candidates.filter(row=>{if(seen.has(row.posting.url))return false;seen.add(row.posting.url);return true;});if(!unique.length)return null;
 const selected=unique.slice(0,50);const subject=`JobRadar ${kind}: ${unique.length} candidate${unique.length===1?'':'s'} · ${profile.name}`;
 const body=[`${profile.name} · ${digestPeriod(now,kind)}`,`Source candidates awaiting role-fit and employment-eligibility review. Showing ${selected.length} of ${unique.length}.`,...selected.map(({posting:p,lastSeenAt})=>`${p.company} — ${p.title}\n${p.location} · ${remoteRegion(p.location,p.description).region}\nSource: ${p.source.provider==='remoteok'?'Remote OK':p.source.provider==='remotive'?'Remotive':p.source.provider}\nLast seen: ${lastSeenAt}\n${p.url}`),'Open JobRadar: http://localhost:3000/discovery','No résumé or recruiter contacts are included in this email.'].join('\n\n');
 return {subject,body,count:unique.length};
}
