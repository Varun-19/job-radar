import {companyKey} from './company-universe';
/** A review reminder, not an inference about current hiring or vacancy ownership. */
export function recruiterReview(contact:{observedAt:string;recruitingStatus:'unverified'|'recruiting'|'not_recruiting'},today:string){
 const observed=Date.parse(`${contact.observedAt}T00:00:00Z`);const now=Date.parse(`${today}T00:00:00Z`);
 const ageDays=Math.floor((now-observed)/86400000);
 if(!Number.isFinite(ageDays)||ageDays<0)return {needsReview:true,ageDays:null,reason:'Check evidence date'};
 if(contact.recruitingStatus==='unverified')return {needsReview:true,ageDays,reason:'Current hiring unverified'};
 return {needsReview:ageDays>=7,ageDays,reason:ageDays>=7?'Recheck hiring evidence':'Recently reviewed; status is manually recorded'};
}

/** Exact company identity supplies context; only explicit job IDs supply vacancy association. */
export function contactsForJob<T extends {company:string;jobIds:string[]}>(job:{id:string;company:string},contacts:T[]):T[]{return contacts.filter(c=>c.jobIds.includes(job.id)||companyKey(c.company)===companyKey(job.company)).sort((a,b)=>Number(b.jobIds.includes(job.id))-Number(a.jobIds.includes(job.id)));}
