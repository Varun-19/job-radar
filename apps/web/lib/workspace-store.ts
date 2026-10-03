'use client';
import { useEffect, useRef, useState } from 'react';
import { initialProfiles, workspaceSchema, jobSchema, tierSchema, type WorkspaceSnapshot, type WorkspaceMutation, type SearchProfile } from '@jobradar/contracts';
import type { CompanyTier } from '@jobradar/domain';
interface Workspace extends WorkspaceSnapshot { profile:string; sorts:Record<string,string> }
const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const empty:Workspace={revision:0,boards:[],postingRevisions:[],profiles:initialProfiles,tiers:{},jobs:[],resumes:[],evidence:[],applications:[],activities:[],profile:'staff',sorts:{}};
async function request(path:string,options?:RequestInit):Promise<WorkspaceSnapshot> {const response=await fetch(`${api}${path}`,options);if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.message??`Backend request failed (${response.status}).`);}return workspaceSchema.parse(await response.json());}
export function useWorkspace() {
 const [data,setData]=useState<Workspace>(empty); const state=useRef(data);
 const [ready,setReady]=useState(false);const [saving,setSaving]=useState(false);const [error,setError]=useState('');const [connected,setConnected]=useState(false);const [hasLocalDrafts,setHasLocalDrafts]=useState(false);
 const queue=useRef(Promise.resolve());
 function apply(next:Workspace) {state.current=next;setData(next);}
 useEffect(()=>{let alive=true; request('/workspace').then(snapshot=>{if(!alive)return;let prefs:{profile?:string;sorts?:Record<string,string>}={};try{prefs=JSON.parse(localStorage.getItem('jobradar.view.v1')??'{}');const old=JSON.parse(localStorage.getItem('jobradar.workbench.v1')??'null');setHasLocalDrafts(!!(old?.jobs?.length||Object.keys(old?.tiers??{}).length));}catch{}const profile=snapshot.profiles.some(p=>p.id===prefs.profile)?prefs.profile!:'staff';apply({...snapshot,profile,sorts:prefs.sorts??{}});setConnected(true);}).catch(e=>{if(alive)setError(`${e.message} Start the database/API, then reload.`);}).finally(()=>{if(alive)setReady(true);});return()=>{alive=false;};},[]);
 function persistView(profile:string,sorts:Record<string,string>){try{localStorage.setItem('jobradar.view.v1',JSON.stringify({profile,sorts}));}catch{setError('View preference could not be saved in this browser.');}}
 function mutate(mutations:WorkspaceMutation[]) {
  if(!connected){setError('Connect the database before saving changes.');return Promise.resolve(false);}
  setSaving(true);setError('');
  const task=queue.current.then(async()=>{const snapshot=await request('/workspace/mutations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedRevision:state.current.revision,mutations})});apply({...snapshot,profile:state.current.profile,sorts:state.current.sorts});});
  const settled=task.then(()=>true).catch(async e=>{setError(`${e.message} Your change was not saved.`);try{const snapshot=await request('/workspace');apply({...snapshot,profile:state.current.profile,sorts:state.current.sorts});}catch{setConnected(false);}return false;}).finally(()=>setSaving(false));queue.current=settled.then(()=>{});return settled;
 }
 function update(change:(previous:Workspace)=>Workspace) {
  const old=state.current;const next=change(old);const mutations:WorkspaceMutation[]=[];
  for(const job of next.jobs){const existing=old.jobs.find(j=>j.id===job.id);if(!existing)mutations.push({type:'add-job',job});else if(existing.shortlisted!==job.shortlisted)mutations.push({type:'shortlist',id:job.id,shortlisted:job.shortlisted});}
  for(const [profileId,tiers] of Object.entries(next.tiers))for(const [company,tier] of Object.entries(tiers))if(old.tiers[profileId]?.[company]!==tier)mutations.push({type:'set-tier',profileId,company,tier});
  if(next.profile!==old.profile||next.sorts!==old.sorts){apply({...old,profile:next.profile,sorts:next.sorts});persistView(next.profile,next.sorts);}
  return mutations.length?mutate(mutations):Promise.resolve(true);
 }
 const tierOf=(company:string):CompanyTier=>data.tiers[data.profile]?.[company.trim().toLowerCase()]??'unclassified';
 const setTier=(company:string,tier:CompanyTier)=>mutate([{type:'set-tier',profileId:data.profile,company,tier}]);
 const saveProfile=(profile:SearchProfile)=>mutate([{type:'save-profile',profile}]);
 async function uploadResume(file:File,label:string){
  if(!connected)return false;setSaving(true);setError('');
  try{if(file.size>4*1024*1024)throw new Error('File exceeds the 4 MB limit.');
   const base64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Unable to read file.'));reader.readAsDataURL(file);});
   const snapshot=await request('/resumes/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedRevision:state.current.revision,label,filename:file.name,base64})});apply({...snapshot,profile:state.current.profile,sorts:state.current.sorts});return true;
  }catch(e){setError(e instanceof Error?e.message:'Upload failed.');try{const snapshot=await request('/workspace');apply({...snapshot,profile:state.current.profile,sorts:state.current.sorts});}catch{setConnected(false);}return false;}finally{setSaving(false);}
 }
 async function importLocalDrafts(){try{const old=JSON.parse(localStorage.getItem('jobradar.workbench.v1')??'null');const mutations:WorkspaceMutation[]=[];for(const raw of old?.jobs??[]){const job=jobSchema.parse(raw);if(!state.current.jobs.some(j=>j.id===job.id))mutations.push({type:'add-job',job});}for(const [profileId,tiers] of Object.entries(old?.tiers??{}))for(const [company,raw] of Object.entries(tiers as object)){if(state.current.tiers[profileId]?.[company]===undefined)mutations.push({type:'set-tier',profileId,company,tier:tierSchema.parse(raw)});}if(mutations.length>500)throw new Error('Too many records for one import.');if(mutations.length)await mutate(mutations); // original browser records are always retained
 }catch(e){setError(e instanceof Error?e.message:'Import failed.');}}
 return {data,mutate,update,tierOf,setTier,saveProfile,ready,saving,error,connected,hasLocalDrafts,importLocalDrafts,uploadResume};
}
