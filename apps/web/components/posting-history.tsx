import type { WorkspaceSnapshot } from '@jobradar/contracts';
export function PostingHistory({revisions,jobId}:{revisions:WorkspaceSnapshot['postingRevisions'];jobId:string}) {
 const history=revisions.filter(r=>r.jobId===jobId).sort((a,b)=>b.version-a.version);
 if(!history.length)return null;
 return <details className="posting-history"><summary>Posting history · {history.length} {history.length===1?'observation':'observations'}</summary>{history.map(r=><article className="timeline-entry" key={r.id}><strong>Version {r.version} · {new Date(r.capturedAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST</strong><p>{r.snapshot.title} · {r.snapshot.location}</p><a className="secondary" href={r.snapshot.url} target="_blank" rel="noreferrer">Source posting ↗</a><details><summary>View preserved description</summary><p className="description">{r.snapshot.description||'No description available.'}</p></details></article>)}</details>;
}
