'use client';
import { ProviderIntake } from './provider-intake';
import { useEffect, useState } from 'react';
import { boardSchema, discoveryResponseSchema, type DiscoveredJob, type WorkspaceMutation, type WorkspaceSnapshot } from '@jobradar/contracts';
import { remoteRegion, sameSource, postingContentChanged, sameBoardScope, companyTier } from '@jobradar/domain';
const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const pageSize = 25;
export function DiscoveryPanel({data, mutate, saving, connected}: {
 data: WorkspaceSnapshot & {profile:string}; mutate:(m:WorkspaceMutation[])=>Promise<boolean>; saving:boolean; connected:boolean;
}) {
 const [boardId,setBoardId] = useState('');
 const [results,setResults] = useState<DiscoveredJob[]>([]);
 const [fetchedAt,setFetchedAt] = useState('');
 const [busy,setBusy] = useState(false);
 const [error,setError] = useState('');
 const [notice,setNotice] = useState('');
 const [terms,setTerms] = useState('');
 const [locations,setLocations] = useState('');
 const [selected,setSelected] = useState<string[]>([]);
 const [page,setPage] = useState(0);
 useEffect(()=>{setSelected([]);setNotice('');},[data.profile]);
 const key = (j:DiscoveredJob)=>`${j.source.provider}:${j.source.board}:${j.source.postingId}`;
 const saved = (j:DiscoveredJob)=>data.jobs.find(old=>old.profileId===data.profile && sameSource(old.source,j.source));
 const match = (text:string,query:string)=>!query.trim() || query.split(',').some(term=>term.trim() && text.toLowerCase().includes(term.trim().toLowerCase()));
 const visible = results.filter(j=>match(j.title,terms) && match(j.location,locations));
 const pages = Math.max(1,Math.ceil(visible.length/pageSize));
 const currentPage = Math.min(page,pages-1);
 const pageRows = visible.slice(currentPage*pageSize,(currentPage+1)*pageSize);
 const selectedRows = visible.filter(j=>selected.includes(key(j)) && !saved(j));
 const selectableRows = pageRows.filter(j=>!saved(j));
 const profileName = data.profiles.find(p=>p.id===data.profile)?.name;
 const priority = (company:string)=>({ 'strategic-target':0,target:1,watch:2,opportunistic:3,unclassified:4,excluded:5 })[companyTier(data.tiers[data.profile],company)];
 const boards = [...data.boards].sort((a,b)=>priority(a.company)-priority(b.company)||a.company.localeCompare(b.company));
 async function addBoard(e:React.FormEvent<HTMLFormElement>) {
  e.preventDefault();const form=new FormData(e.currentTarget);
  const parsed=boardSchema.safeParse({id:crypto.randomUUID(),company:form.get('company'),provider:form.get('provider'),token:form.get('token'),searchText:String(form.get('searchText')??'').trim()||undefined});
  if(!parsed.success){setError(parsed.error.issues[0]?.message??'Enter the company/source name and a supported token format.');return;}
  if(data.boards.some(b=>sameBoardScope(b,parsed.data))){setError('This board and source query are already configured.');return;}
  if(await mutate([{type:'save-board',board:parsed.data}])) {
   setBoardId(parsed.data.id);setResults([]);setFetchedAt('');setSelected([]);setPage(0);setError('');setNotice('Company board saved.');
  }
 }
 async function scan() {
  const board=data.boards.find(b=>b.id===boardId);if(!board)return;
  setBusy(true);setError('');setNotice('');setResults([]);setFetchedAt('');setSelected([]);setPage(0);
  try {
   const response=await fetch(`${api}/discovery/preview`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({board})});
   if(!response.ok){const body=await response.json();throw new Error(body.message??'Board fetch failed.');}
   const payload=discoveryResponseSchema.parse(await response.json());setResults(payload.jobs);setFetchedAt(payload.fetchedAt);
  } catch(e) {setError(e instanceof Error?e.message:'Board fetch failed.');}
  finally {setBusy(false);}
 }
 async function importJobs() {
  if(!selectedRows.length)return;
  if(selectedRows.length>100){setError('Import up to 100 postings at a time.');return;}
  const ok=await mutate(selectedRows.map(j=>({type:'add-job',job:{...j,id:crypto.randomUUID(),profileId:data.profile,createdAt:j.source.fetchedAt,alignment:'review',fit:'unknown',eligibility:'unknown',shortlisted:false}})));
  if(ok){setSelected([]);setNotice(`${selectedRows.length} postings saved in Needs review for ${profileName}.`);setError('');}
 }
 async function refresh(j:DiscoveredJob) {
  const existing=saved(j);if(!existing)return;
  const changed=postingContentChanged(existing,j);
  if(await mutate([{type:'refresh-job',id:existing.id,posting:j}])) {
   setNotice(changed?'Posting updated. Its previous version is retained; review fit and eligibility again.':'Observation recorded. Posting content and your assessment are unchanged.');setError('');
  }
 }
 function filter(value:string,setValue:(v:string)=>void){setValue(value);setPage(0);setSelected([]);}
 return <><ProviderIntake data={data} profileId={data.profile} mutate={mutate} saving={saving} connected={connected}/><section className="panel field-space discovery-panel" aria-label="Live job discovery">
  <p className="eyebrow">COMPANY BOARDS & REMOTE FEEDS</p>
  <h2>Discover real postings</h2>
  <p className="muted">Fetch a company board, filter roles and locations, then save promising jobs to {profileName}.</p>
  <details>
   <summary>Add a company board</summary>
   <form onSubmit={addBoard}>
    <div className="form-grid">
     <label>Company name<input name="company" required maxLength={200}/></label>
     <label>Provider<select name="provider"><option value="greenhouse">Greenhouse</option><option value="lever">Lever</option><option value="lever-eu">Lever EU</option><option value="ashby">Ashby</option><option value="workable">Workable</option><option value="workday">Workday</option><option value="smartrecruiters">SmartRecruiters</option><option value="rippling">Rippling ATS</option><option value="oracle">Oracle Recruiting Cloud</option><option value="remoteok">Remote OK</option><option value="remotive">Remotive</option><option value="arbeitnow">Arbeitnow</option><option value="weworkremotely">We Work Remotely RSS</option></select></label>
     <label>Board token<input name="token" required maxLength={200}/></label><label>Source query (optional, Workday / SmartRecruiters)<input name="searchText" maxLength={200} placeholder="frontend"/></label>
    </div>
    <p className="fine-print">Hosted boards use their company token. Workday: tenant/wdN/site. Oracle: tenant.fa.region.oraclecloud.com/site. Remote feeds: all. Verify company identity before saving. Workday and SmartRecruiters can have separate query scopes (for example frontend and SAP); each scope has its own scan schedule. Remote feeds preserve their own source links; country eligibility needs review.</p>
    <button className="secondary" disabled={!connected||saving||busy}>Save board</button>
   </form>
  </details>
  <div className="toolbar field-space discovery-toolbar">
   <label>Company board<select disabled={busy||saving} value={boardId} onChange={e=>{setBoardId(e.target.value);setResults([]);setFetchedAt('');setSelected([]);setPage(0);setNotice('');setError('');}}>
    <option value="">Choose a configured board</option>
    {boards.map(b=><option key={b.id} value={b.id}>{b.company} · {b.provider}{b.searchText?` · query: ${b.searchText}`:''}</option>)}
   </select></label>
   <button className="button" onClick={scan} disabled={!boardId||busy||saving}>{busy?'Fetching…':'Fetch postings'}</button>
   <label>Title contains<input placeholder="staff, frontend, SAP" value={terms} onChange={e=>filter(e.target.value,setTerms)}/></label>
   <label>Location contains<input placeholder="Bengaluru, India, remote" value={locations} onChange={e=>filter(e.target.value,setLocations)}/></label>
  </div>
  <p className="fine-print">Comma-separated terms match any term. These filters do not confirm role fit or employment eligibility.</p>
  {error&&<p role="alert" className="notice">{error}</p>}
  {notice&&<p role="status" className="notice">{notice}</p>}
  {fetchedAt&&<>
   <div className="discovery-meta" role="status"><strong>{visible.length} matching · {results.length} fetched</strong><time dateTime={fetchedAt}>Checked {new Date(fetchedAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})} IST</time></div>
   <div className="actions">
    <button className="secondary" disabled={busy||saving||!connected||!selectableRows.length} onClick={()=>setSelected(prev=>Array.from(new Set([...prev,...selectableRows.map(key)])).slice(0,100))}>Select this page ({selectableRows.length})</button>
    <button className="text-button" disabled={!selected.length||saving} onClick={()=>setSelected([])}>Clear selection</button>
    <button className="button" disabled={busy||saving||!connected||!selectedRows.length} onClick={importJobs}>Save {selectedRows.length||''} selected to Needs review</button>
   </div>
   {pageRows.map(j=>{
    const existing=saved(j);const changed=!!existing&&postingContentChanged(existing,j);
    const newer=!!existing&&j.source.fetchedAt>existing.source!.fetchedAt;
    return <article className="evidence-row discovery-result" key={key(j)}>
     <label className="checkbox"><input type="checkbox" disabled={!!existing||saving||(!selected.includes(key(j))&&selected.length>=100)} checked={selected.includes(key(j))&&!existing} onChange={e=>setSelected(prev=>e.target.checked?[...prev,key(j)]:prev.filter(id=>id!==key(j)))}/><strong>{j.title}</strong></label>
     <p>{j.company} · {j.location} · {j.source.provider==='remoteok'?'Remote OK':j.source.provider}</p>
     <p className="fine-print">{remoteRegion(j.location,j.description).region} · India eligibility unverified</p>{existing&&<p className="result-status">{changed?'Posting changed since your saved version.':'Saved for this profile.'}</p>}
     <div className="actions compact"><a className="secondary" href={j.url} target="_blank" rel="noreferrer">Source posting ↗</a>{existing&&<button className="secondary" disabled={saving||busy||!connected||!newer} onClick={()=>refresh(j)}>{changed?'Update saved posting':'Record latest check'}</button>}</div>
     <details><summary>Read description</summary><p className="description">{j.description||'No description provided by source.'}</p></details>
    </article>;
   })}
   {visible.length>pageSize&&<div className="discovery-pagination" aria-label="Discovery result pages"><button className="secondary" disabled={currentPage===0||saving} onClick={()=>setPage(currentPage-1)}>Previous</button><span>Page {currentPage+1} of {pages}</span><button className="secondary" disabled={currentPage===pages-1||saving} onClick={()=>setPage(currentPage+1)}>Next</button></div>}
   {!visible.length&&<p className="discovery-empty">No postings match these filters. Try broader terms.</p>}
  </>}
  <p className="fine-print">Fetching leaves saved jobs unchanged. Updates retain previous versions; changed content returns to Needs review. A missing posting or failed fetch does not confirm closure.</p>
 </section></>;
}
