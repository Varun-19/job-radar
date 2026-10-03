export const terminalStages = ['accepted','rejected','withdrawn'] as const;
const progression = ['preparing','applied','recruiter','technical','final','offer','accepted'];
/** Manual corrections/reopening require an explanation; ordinary forward moves can skip stages. */
export function requiresCorrectionNote(from:string,to:string,resumeChanged:boolean):boolean {
 return ((terminalStages as readonly string[]).includes(from) && from!==to)
  || (progression.includes(from) && progression.includes(to) && progression.indexOf(to)<progression.indexOf(from))
  || (from!=='preparing' && resumeChanged);
}
