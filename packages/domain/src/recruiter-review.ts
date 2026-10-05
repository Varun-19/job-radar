/** A review reminder, not an inference about current hiring or vacancy ownership. */
export function recruiterReview(contact:{observedAt:string;recruitingStatus:'unverified'|'recruiting'|'not_recruiting'},today:string){
 const observed=Date.parse(`${contact.observedAt}T00:00:00Z`);const now=Date.parse(`${today}T00:00:00Z`);
 const ageDays=Math.floor((now-observed)/86400000);
 if(!Number.isFinite(ageDays)||ageDays<0)return {needsReview:true,ageDays:null,reason:'Check evidence date'};
 if(contact.recruitingStatus==='unverified')return {needsReview:true,ageDays,reason:'Current hiring unverified'};
 return {needsReview:ageDays>=7,ageDays,reason:ageDays>=7?'Recheck hiring evidence':'Recently reviewed; status is manually recorded'};
}
