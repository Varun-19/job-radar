import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareOpportunities, opportunityGroup, type OpportunityDraft, type CompanyTier } from '@jobradar/domain';
const base: OpportunityDraft = { id:'a',profileId:'staff',company:'Unknown',title:'Staff',location:'India',description:'',url:'',createdAt:'2026-10-03',alignment:'primary',fit:'strong',eligibility:'confirmed',shortlisted:false };
test('preferred relevant company precedes newer stronger unfamiliar result',()=>{const preferred={...base,company:'Google',fit:'partial' as const,createdAt:'2026-01-01'};const tier=(c:string):CompanyTier=>c==='Google'?'strategic-target':'unclassified'; assert.ok(compareOpportunities(preferred,base,tier)<0);});
test('company desirability does not override role or eligibility',()=>{assert.equal(opportunityGroup({...base,alignment:'outside'},'strategic-target'),'Outside target');assert.equal(opportunityGroup({...base,eligibility:'unknown'},'strategic-target'),'Needs review');assert.equal(opportunityGroup({...base,eligibility:'ineligible'},'strategic-target'),'Outside target');});
test('excluded companies remain outside target regardless of role',()=>assert.equal(opportunityGroup(base,'excluded'),'Outside target'));
test('same posting uses the company preference of the selected profile',()=>{assert.equal(opportunityGroup(base,'target'),'Target companies');assert.equal(opportunityGroup(base,'watch'),'Discoveries');});
