'use client';
import { companyKey } from '@jobradar/domain';
import { useState } from 'react';
import { companies, tiers, tierLabels } from '../lib/universe';
import { useWorkspace } from '../lib/workspace-store';
const feeds = new Set(['remoteok', 'remotive', 'arbeitnow', 'weworkremotely']);
const pageSize = 20;
export function CompanyPreferences() {
 const {data,update,tierOf,setTier,ready,saving,error,connected} = useWorkspace();
 const [query,setQuery]=useState('');const [view,setView]=useState('priority');const [page,setPage]=useState(0);
 const employers=new Map<string,string>();
 for(const name of [...companies,...data.jobs.map(j=>j.company),...data.boards.filter(b=>!feeds.has(b.provider)).map(b=>b.company)])if(!employers.has(companyKey(name)))employers.set(companyKey(name),name);
 const universe=[...employers.values()];
 const rank=(name:string)=>['strategic-target','target','watch','opportunistic','unclassified','excluded'].indexOf(tierOf(name));
 const rows=universe.filter(name=>name.toLowerCase().includes(query.toLowerCase())&&(view==='all'||view==='priority'&&['strategic-target','target'].includes(tierOf(name))||view==='unclassified'&&tierOf(name)==='unclassified')).sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b));
 const pages=Math.max(1,Math.ceil(rows.length/pageSize));const current=Math.min(page,pages-1);
 if(!ready)return <p>Loading preferences…</p>;
 return <><header><div><p className="eyebrow">YOUR COMPANY UNIVERSE</p><h1>Target companies</h1><p className="muted">Set priorities for this search. Discovery can still find companies outside this universe.</p></div></header>
 <div className="workspace-bar"><label>Search profile<select value={data.profile} onChange={e=>{setPage(0);update(d=>({...d,profile:e.target.value}));}}>{data.profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><span>{connected?'Preferences saved':'Backend unavailable'}{saving?' · Saving…':''}</span></div>{error&&<p role="alert">{error}</p>}
 <div className="toolbar"><label className="search-field">Find a company<input value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}} placeholder="Search this view"/></label></div>
 <div className="queue-tabs" aria-label="Company views">{[['priority','Priority companies'],['unclassified','Unclassified'],['all','All companies']].map(([id,label])=><button key={id} aria-pressed={view===id} onClick={()=>{setView(id);setPage(0);}}>{label} · {universe.filter(c=>id==='all'||id==='priority'&&['strategic-target','target'].includes(tierOf(c))||id==='unclassified'&&tierOf(c)==='unclassified').length}</button>)}</div>
 <div className="company-table">{rows.slice(current*pageSize,(current+1)*pageSize).map(c=><div className="company-preference" key={companyKey(c)}><div><strong>{c}</strong><small>{data.boards.filter(b=>!feeds.has(b.provider)&&companyKey(b.company)===companyKey(c)).map(b=>`${b.provider}${b.searchText?` · ${b.searchText}`:''}`).join(' · ')||'Manual discovery available'}</small><a className="secondary fine-print" href={`https://www.google.com/search?q=${encodeURIComponent(c+' careers')}`} target="_blank" rel="noreferrer">Find careers page ↗</a></div><select disabled={!connected||saving} aria-label={`Tier for ${c}`} value={tierOf(c)} onChange={e=>setTier(c,e.target.value as typeof tiers[number])}>{tiers.map(t=><option key={t} value={t}>{tierLabels[t]}</option>)}</select></div>)}</div>
 {!rows.length&&<p className="notice">{query?'No companies match this search.':view==='priority'?'No priority companies yet. Open All companies to choose your strategic targets and targets.':'No companies in this view.'}</p>}
 {pages>1&&<div className="company-pagination" aria-label="Company pages"><button className="secondary" disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button><span>Page {current+1} of {pages} · {rows.length} companies</span><button className="secondary" disabled={current===pages-1} onClick={()=>setPage(current+1)}>Next</button></div>}
 <p className="fine-print">{universe.length} employers retained. Explicit aliases share one preference; remote job feeds are managed as sources in Discovery. Company priority never overrides role fit or eligibility.</p></>;
}
