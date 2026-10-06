import {test} from 'node:test';
import assert from 'node:assert/strict';
import {currentDiscoveryMatch,workspaceSchema} from '@jobradar/contracts';
import {opportunityGroup} from '@jobradar/domain';
test('retained automatic leads that no longer match move out of review without changing saved decisions',()=>{
 const state=workspaceSchema.parse({revision:1,tiers:{},profiles:[{id:'staff',name:'Frontend',version:1,levels:['Staff'],roleFamilies:['Frontend'],locations:['India'],keywords:[],exclusions:[],discovery:{levelTerms:['Staff'],roleTerms:['Frontend'],locationTerms:['India'],excludedTitleTerms:[]}}],boards:[{id:'board',company:'Example',provider:'greenhouse',token:'example'}],jobs:[{id:'job',profileId:'staff',company:'Example',title:'Staff Storage Engineer',location:'India',description:'Storage',url:'https://example.com/jobs/1',alignment:'review',fit:'unknown',eligibility:'unknown',shortlisted:false,createdAt:'2026-10-06T00:00:00Z',source:{provider:'greenhouse',board:'example',postingId:'1',fetchedAt:'2026-10-06T00:00:00Z',updatedAt:null}}]});
 const job=state.jobs[0];const match=(j=job)=>currentDiscoveryMatch(j,state.profiles[0],state.boards);
 assert.equal(match(),false);assert.equal(opportunityGroup(job,'unclassified',match()),'Outside target');assert.equal(job.alignment,'review');
 assert.equal(match({...job,alignment:'primary'}),true);assert.equal(match({...job,fit:'partial'}),true);assert.equal(match({...job,evaluationId:'accepted'}),true);
 const imported={...job,source:{...job.source!,provider:'company' as const,board:'example.com'}};assert.equal(match(imported),true);assert.equal(opportunityGroup(imported,'unclassified',match(imported)),'Needs review');
 const newEmployer={...job,title:'Staff Frontend Engineer'};assert.equal(opportunityGroup(newEmployer,'unclassified',match(newEmployer)),'Needs review');
});
