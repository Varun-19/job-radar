export interface DiscoveryCriteria {levelTerms:string[];roleTerms:string[];locationTerms:string[];excludedTitleTerms:string[]}
export interface SearchablePosting {title:string;description:string;location:string}
function containsTerm(text:string,term:string){
 const canonical=(value:string)=>value.replace(/\bfront[\s-]*end\b/gi,'frontend').replace(/\bback[\s-]*end\b/gi,'backend');
 const escaped=canonical(term.trim()).replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/[\s-]+/g,'[\\s-]+');
 return !!escaped&&new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?:s)?(?=$|[^\\p{L}\\p{N}])`,'iu').test(canonical(text));
}
function includesAny(text:string,terms:string[]){return !terms.length||terms.some(term=>containsTerm(text,term));}
function descriptionRoleTerms(terms:string[]){return terms.filter(term=>term.trim().toLowerCase()!=='ui');}
function roleInDescription(posting:SearchablePosting,terms:string[]){const descriptive=descriptionRoleTerms(terms);return !terms.length||descriptive.length>0&&includesAny(posting.description,descriptive);}
export function candidateSignals(posting:SearchablePosting,criteria:DiscoveryCriteria){
 const reasons:string[]=[];
 if(!includesAny(posting.title,criteria.levelTerms))return {candidate:false,reasons:['Title does not match configured level terms.']};
 if(!includesAny(posting.title,criteria.roleTerms)&&!roleInDescription(posting,criteria.roleTerms))return {candidate:false,reasons:['No configured role terms appear in the title or description.']};
 if(!includesAny(posting.location,criteria.locationTerms))return {candidate:false,reasons:['Location text does not match the discovery criteria.']};
 if(criteria.excludedTitleTerms.some(term=>containsTerm(posting.title,term)))return {candidate:false,reasons:['Title matches an explicit discovery exclusion.']};
 if(criteria.levelTerms.length)reasons.push('Title matches a configured level term.');
 if(criteria.roleTerms.length)reasons.push('Title or description contains a configured role term.');
 if(criteria.locationTerms.length)reasons.push('Location text matches a configured location term; employment eligibility remains unverified.');
 return {candidate:true,reasons};
}
/** Retrieval strength is separate from a human assessment of professional fit. */
export function discoveryRoleRank(posting:SearchablePosting,criteria:DiscoveryCriteria){
 return includesAny(posting.title,criteria.roleTerms)?0:roleInDescription(posting,criteria.roleTerms)?1:2;
}
/** Sort retrieval leads without asserting employment eligibility or professional fit. */
export function discoveryPriority(posting:SearchablePosting,criteria:DiscoveryCriteria,preferredLocations:string[]){
 const location=posting.location.replace(/\bbangalore\b/gi,'Bengaluru');
 const preferred=!preferredLocations.length||preferredLocations.some(value=>value.replace(/\bbangalore\b/gi,'Bengaluru').split(/[\s/,·]+/).filter(Boolean).every(term=>containsTerm(location,term)));
 const level=criteria.levelTerms.findIndex(term=>containsTerm(posting.title,term));
 return (preferred?0:100)+discoveryRoleRank(posting,criteria)*10+(level<0?criteria.levelTerms.length:level);
}
