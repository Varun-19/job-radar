import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareOpportunities, discoveryPriority,discoveryRoleRank,opportunityGroup, type OpportunityDraft, type CompanyTier } from '@jobradar/domain';
const base: OpportunityDraft = { id:'a',profileId:'staff',company:'Unknown',title:'Staff',location:'India',description:'',url:'',createdAt:'2026-10-03',alignment:'primary',fit:'strong',eligibility:'confirmed',shortlisted:false };
test('preferred relevant company precedes newer stronger unfamiliar result',()=>{const preferred={...base,company:'Google',fit:'partial' as const,createdAt:'2026-01-01'};const tier=(c:string):CompanyTier=>c==='Google'?'strategic-target':'unclassified'; assert.ok(compareOpportunities(preferred,base,tier)<0);});
test('company desirability does not override role or eligibility',()=>{assert.equal(opportunityGroup({...base,alignment:'outside'},'strategic-target'),'Outside target');assert.equal(opportunityGroup({...base,eligibility:'unknown'},'strategic-target'),'Needs review');assert.equal(opportunityGroup({...base,eligibility:'ineligible'},'strategic-target'),'Outside target');});
test('excluded companies remain outside target regardless of role',()=>assert.equal(opportunityGroup(base,'excluded'),'Outside target'));
test('same posting uses the company preference of the selected profile',()=>{assert.equal(opportunityGroup(base,'target'),'Target companies');assert.equal(opportunityGroup(base,'watch'),'Discoveries');});

test('unverified eligibility keeps a clear role in review while preferred companies sort first within that queue',()=>{const preferred={...base,company:'Google',eligibility:'unknown' as const,fit:'unknown' as const};const other={...base,id:'b',eligibility:'unknown' as const};assert.equal(opportunityGroup(preferred,'strategic-target'),'Needs review');assert.ok(compareOpportunities(preferred,other,c=>c==='Google'?'strategic-target':'unclassified')<0);});
test('within the same preference and assessment, clear role titles precede newer description-only matches',()=>{
 const criteria={levelTerms:['staff'],roleTerms:['frontend','React'],locationTerms:['India'],excludedTitleTerms:[]};
 const direct={...base,title:'Staff Frontend Engineer',alignment:'review' as const,fit:'unknown' as const,eligibility:'unknown' as const};
 const indirect={...direct,id:'b',title:'Staff Platform Engineer',description:'Some React work',createdAt:'2026-10-06'};
 assert.ok(compareOpportunities(direct,indirect,()=> 'unclassified',j=>discoveryRoleRank(j,criteria))<0);
 assert.ok(compareOpportunities({...direct,company:'Other'},indirect,c=>c==='Other'?'unclassified':'target',j=>discoveryRoleRank(j,criteria))>0);
});
test('retrieval priority prefers requested locations and staff titles without confirming eligibility',()=>{
 const criteria={levelTerms:['staff','principal','lead'],roleTerms:['frontend','React'],locationTerms:['India','Remote'],excludedTitleTerms:[]};
 const rank=(j:OpportunityDraft)=>discoveryPriority(j,criteria,['Bengaluru','India Remote']);
 const local={...base,title:'Staff Frontend Engineer',location:'Bangalore, India',alignment:'review' as const,fit:'unknown' as const,eligibility:'unknown' as const};
 const remoteUS={...local,id:'b',location:'Remote (United States)',createdAt:'2026-10-06'};
 const lead={...local,id:'c',title:'Lead Frontend Engineer',createdAt:'2026-10-06'};
 assert.ok(compareOpportunities(local,remoteUS,()=> 'unclassified',rank)<0);assert.ok(compareOpportunities(local,lead,()=> 'unclassified',rank)<0);assert.equal(local.eligibility,'unknown');
 assert.ok(rank({...local,location:'Remote — India'})<rank(remoteUS));
});
