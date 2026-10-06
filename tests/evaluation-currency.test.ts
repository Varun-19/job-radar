import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluationIsCurrent,initialProfiles,workspaceSchema} from '@jobradar/contracts';

test('an assessment is current only for the current profile and latest posting revision',()=>{
 const state=workspaceSchema.parse({revision:1,tiers:{},profiles:initialProfiles,jobs:[{id:'job',profileId:'staff',company:'Example',title:'Staff Frontend',location:'India',description:'Frontend',url:'',alignment:'review',fit:'unknown',eligibility:'unknown',shortlisted:false,createdAt:'2026-10-06T00:00:00Z'}]});
 const proposal={jobId:'job',profileVersion:1,postingRevisionId:null};
 assert.equal(evaluationIsCurrent(state,proposal),true);
 assert.equal(evaluationIsCurrent(state,{...proposal,profileVersion:2}),false);
 const revisions=[2,1].map(version=>({id:`posting-${version}`,jobId:'job',version,capturedAt:'2026-10-06T00:00:00Z',snapshot:state.jobs[0]}));
 const refreshed={...state,postingRevisions:revisions};
 assert.equal(evaluationIsCurrent(refreshed,proposal),false);
 assert.equal(evaluationIsCurrent(refreshed,{...proposal,postingRevisionId:'posting-1'}),false);
 assert.equal(evaluationIsCurrent(refreshed,{...proposal,postingRevisionId:'posting-2'}),true);
 assert.equal(evaluationIsCurrent({...refreshed,profiles:state.profiles.map(p=>({...p,version:2}))},{...proposal,postingRevisionId:'posting-2'}),false);
 assert.equal(evaluationIsCurrent(state,{...proposal,jobId:'missing'}),false);
});
