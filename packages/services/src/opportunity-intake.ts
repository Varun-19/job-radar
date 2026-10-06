import {randomUUID} from 'node:crypto';
import {candidateSignals,companyTier,sameSource,postingContentChanged} from '@jobradar/domain';
import {canonicalPostingUrl,jobSchema,type WorkspaceSnapshot,type RadarSnapshot,type WorkspaceMutation} from '@jobradar/contracts';
/** Retrieve plausible matches into review, without inferring fit or eligibility. */
export function opportunityIntake(workspace:WorkspaceSnapshot,radar:RadarSnapshot):WorkspaceMutation[]{
 const changes:WorkspaceMutation[]=[];const known=[...workspace.jobs];
 for(const profile of workspace.profiles){if(!profile.discovery)continue;
  for(const row of radar.inbox){const posting={...row.posting,company:row.posting.company.trim()||'Unknown company',title:row.posting.title.trim(),location:row.posting.location.trim()||'Unknown'};
   if(row.missingCount>0)continue;
   const existing=known.find(job=>job.profileId===profile.id&&(sameSource(job.source,posting.source)||!!job.url&&canonicalPostingUrl(job.url)===canonicalPostingUrl(posting.url)));
   if(existing){if(sameSource(existing.source,posting.source)&&postingContentChanged(existing,posting)&&Date.parse(posting.source.fetchedAt)>=Date.parse(existing.source?.fetchedAt??'')){changes.push({type:'refresh-job',id:existing.id,posting});known[known.indexOf(existing)]={...existing,...posting,alignment:'review',fit:'unknown',eligibility:'unknown'};}continue;}
   // Existing saved jobs must refresh even when a location/title change makes them no longer match.
   if(!candidateSignals(posting,profile.discovery).candidate||companyTier(workspace.tiers[profile.id],posting.company)==='excluded')continue;
   const job={...posting,company:posting.company||'Unknown company',location:posting.location||'Unknown',id:randomUUID(),profileId:profile.id,createdAt:posting.source.fetchedAt,alignment:'review' as const,fit:'unknown' as const,eligibility:'unknown' as const,shortlisted:false};if(!jobSchema.safeParse(job).success)continue;known.push(job);changes.push({type:'add-job',job});
  }
 }
 // The mutation API retains atomic versioning and source history for each batch.
 return changes.slice(0,500);
}
