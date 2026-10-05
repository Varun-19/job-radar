'use client';
import type {SearchProfile} from '@jobradar/contracts';
/** Keep the complete selected name visible while retaining native keyboard selection. */
export function ProfileSelect({profiles,value,onChange}:{profiles:SearchProfile[];value:string;onChange:(value:string)=>void}){
 const selected=profiles.find(profile=>profile.id===value);
 return <label>Search profile<span className="profile-select"><select aria-label="Search profile" value={value} onChange={event=>onChange(event.target.value)}>{profiles.map(profile=><option key={profile.id} value={profile.id}>{profile.name}</option>)}</select><span className="selected-profile-name" aria-hidden="true">{selected?.name??'Choose a profile'}</span><span className="profile-select-chevron" aria-hidden="true">⌄</span></span></label>;
}
