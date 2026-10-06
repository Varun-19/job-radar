/** Only these adapters pass searchText to the upstream provider. */
export function supportsBoardQuery(provider:string){return ['workday','smartrecruiters','oracle'].includes(provider);}
export function sameBoardScope(a:{provider:string;token:string;searchText?:string},b:{provider:string;token:string;searchText?:string}){return a.provider===b.provider&&a.token===b.token&&(!supportsBoardQuery(a.provider)||(a.searchText??'').trim().toLowerCase()===(b.searchText??'').trim().toLowerCase());}
