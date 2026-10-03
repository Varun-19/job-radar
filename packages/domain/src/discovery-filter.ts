export interface DiscoveryCriteria {levelTerms:string[];roleTerms:string[];locationTerms:string[];excludedTitleTerms:string[]}
export interface SearchablePosting {title:string;description:string;location:string}
function includesAny(text:string,terms:string[]){return !terms.length||terms.some(term=>text.toLowerCase().includes(term.toLowerCase()));}
export function candidateSignals(posting:SearchablePosting,criteria:DiscoveryCriteria){
 const reasons:string[]=[];
 if(!includesAny(posting.title,criteria.levelTerms))return {candidate:false,reasons:['Title does not match configured level terms.']};
 if(!includesAny(`${posting.title}\n${posting.description}`,criteria.roleTerms))return {candidate:false,reasons:['No configured role terms appear in the title or description.']};
 if(!includesAny(posting.location,criteria.locationTerms))return {candidate:false,reasons:['Location text does not match the discovery criteria.']};
 if(criteria.excludedTitleTerms.some(term=>posting.title.toLowerCase().includes(term.toLowerCase())))return {candidate:false,reasons:['Title matches an explicit discovery exclusion.']};
 if(criteria.levelTerms.length)reasons.push('Title matches a configured level term.');
 if(criteria.roleTerms.length)reasons.push('Title or description contains a configured role term.');
 if(criteria.locationTerms.length)reasons.push('Location text matches a configured location term; employment eligibility remains unverified.');
 return {candidate:true,reasons};
}
