/** Text checks and term evidence are explainable diagnostics, never an employer ATS score. */
export type ResumeCheck={name:string;status:'pass'|'review';detail:string};
const vocabulary=['React','TypeScript','JavaScript','Next.js','HTML','CSS','Node.js','GraphQL','REST','Redux','accessibility','WCAG','design system','micro frontend','observability','performance','testing','architecture','mentoring','leadership','SAP','S/4HANA','ABAP','Fiori','UI5','BTP','SuccessFactors','SAC','FI/CO','SD','MM','EWM','SQL','Python','Java','Kubernetes','AWS','Azure','GCP'];
const normalize=(s:string)=>s.toLowerCase().replace(/\s+/g,' ').trim();
function hasTerm(text:string,term:string){const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`,'i').test(text);}
export function resumeReview(text:string,description='',extraTerms:string[]=[]){
 const checks:ResumeCheck[]=[
 {name:'Extractable text',status:text.trim().length>=300?'pass':'review',detail:`${text.trim().length.toLocaleString()} extracted characters; compare reading order with the original document.`},
 {name:'Text encoding',status:/\uFFFD/.test(text)?'review':'pass',detail:/\uFFFD/.test(text)?'Replacement characters found; inspect lost text.':'No Unicode replacement characters detected.'},
 {name:'Contact information',status:/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text)?'pass':'review',detail:'Check that your email, phone and links are readable in the original and extracted text.'},
 {name:'Experience heading',status:/\b(experience|employment|work history)\b/i.test(text)?'pass':'review',detail:'A conventional experience heading makes sections easier to identify.'},
 {name:'Skills heading',status:/\b(skills|technologies|technical expertise)\b/i.test(text)?'pass':'review',detail:'Review a clearly labeled skills section; include only skills you can support.'},
 {name:'Education heading',status:/\b(education|qualification)\b/i.test(text)?'pass':'review',detail:'Check the education section and dates.'},
 {name:'Measurable outcomes',status:/\d+\s*(%|percent|users|customers|ms|seconds|teams)/i.test(text)?'pass':'review',detail:'Metrics can substantiate impact; their truth and context require your review.'},
 {name:'Visual layout',status:'review',detail:'Text extraction cannot establish column order, text in images, headers, tables or employer parser compatibility. Inspect the original PDF.'}
 ];
 const terms=[...new Set([...vocabulary.filter(term=>hasTerm(description,term)),...extraTerms.map(s=>s.trim()).filter(Boolean)])].slice(0,100);
 const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);const jobLines=description.split(/\n+|(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
 const requirements=terms.map(term=>({term,inResume:hasTerm(text,term),resumeQuote:lines.find(line=>hasTerm(line,term))??'',jobQuote:jobLines.find(line=>hasTerm(line,term))??'',origin:hasTerm(description,term)?'posting':'user-added'}));
 return {checks,requirements,matched:requirements.filter(r=>r.inResume).length,total:requirements.length};
}
export function tailoringDraft(text:string,evidence:{id:string;capability:string;description:string;quote:string;resumeVersionId:string|null}[],resumeId:string,terms:string[]){
 const selected=evidence.filter(e=>e.resumeVersionId===resumeId&&e.quote.trim()&&normalize(text).includes(normalize(e.quote))&&terms.some(term=>hasTerm(e.capability+' '+e.description+' '+e.quote,term)));
 // Keep the original chronology and claims; only add exact source excerpts for the user to edit and review.
 return {evidenceIds:selected.map(e=>e.id),text:selected.length?`SELECTED PROFESSIONAL HIGHLIGHTS\n${selected.map(e=>`• ${e.quote.replace(/\s+/g,' ').trim()}`).join('\n')}\n\n${text}`:text};
}
export function remoteRegion(location:string,description:string){
 const text=normalize(`${location}\n${description}`);
 if(/\b(us only|usa only|united states only|must (?:be|reside|live).{0,25}(?:united states|usa)|remote.{0,5}(?:us|usa)\b)/i.test(text))return {region:'US restricted',eligibleFromIndia:'unverified',reason:'US restriction detected; verify residency and work authorization.'};
 if(/\b(india|bengaluru|bangalore)\b/i.test(location))return {region:'India listed',eligibleFromIndia:'unverified',reason:'India appears in the listing; confirm employment arrangement and remote policy.'};
 if(/anywhere in the world|worldwide|globally remote/i.test(text))return {region:'Worldwide stated',eligibleFromIndia:'unverified',reason:'Worldwide language found; confirm country exclusions, payroll and time-zone requirements.'};
 return {region:/remote/i.test(text)?'Remote · region unspecified':'Region needs review',eligibleFromIndia:'unverified',reason:'Do not infer hiring eligibility from a remote label.'};
}
