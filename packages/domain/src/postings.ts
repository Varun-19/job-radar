export interface PostingContent { company:string; title:string; location:string; description:string; url:string }
export interface SourceIdentity { provider:string; board:string; postingId:string }
export function sameSource(a:SourceIdentity|undefined,b:SourceIdentity|undefined){return !!a&&!!b&&a.provider===b.provider&&a.board===b.board&&a.postingId===b.postingId;}
export function postingContentChanged(a:PostingContent,b:PostingContent){return (['company','title','location','description','url'] as const).some(field=>a[field]!==b[field]);}
