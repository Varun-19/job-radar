import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workspaceSchema,radarSchema} from '@jobradar/contracts';
import {opportunityIntake} from '../packages/services/src/opportunity-intake';
const profile={id:'frontend',name:'Frontend',version:1,roleFamilies:['Frontend'],levels:['Staff'],locations:['India'],keywords:[],exclusions:[],discovery:{levelTerms:['staff'],roleTerms:['frontend'],locationTerms:['India'],excludedTitleTerms:['manager']}};
const posting={company:'Acme',title:'Staff Frontend Engineer',location:'India Remote',description:'Own frontend architecture',url:'https://example.com/jobs/1',source:{provider:'greenhouse',board:'acme',postingId:'1',updatedAt:null,fetchedAt:'2026-10-05T00:00:00Z'}};
const inbox=(p=posting)=>({id:p.source.postingId,boardId:'acme',posting:p,version:1,firstSeenAt:p.source.fetchedAt,lastSeenAt:p.source.fetchedAt,changedAt:p.source.fetchedAt,change:'new',missingCount:0});
function fixtures(){return {workspace:workspaceSchema.parse({revision:0,profiles:[profile,{...profile,id:'sap',discovery:{...profile.discovery,roleTerms:['SAP']}}],jobs:[],tiers:{}}),radar:radarSchema.parse({schedules:[],runs:[],inbox:[inbox()]})};}
test('new source matches enter only matching profiles with unknown review state, once per source or URL',()=>{
 const {workspace,radar}=fixtures();radar.inbox.push({...radar.inbox[0],id:'duplicate',posting:{...radar.inbox[0].posting,source:{...radar.inbox[0].posting.source,postingId:'other'},url:posting.url+'?utm_source=feed'}});
 const changes=opportunityIntake(workspace,radar);assert.equal(changes.length,1);assert.equal(changes[0].type,'add-job');if(changes[0].type!=='add-job')throw Error();const job=changes[0].job;assert.equal(job.profileId,'frontend');assert.equal(job.alignment,'review');assert.equal(job.fit,'unknown');assert.equal(job.eligibility,'unknown');workspace.jobs.push(job);assert.deepEqual(opportunityIntake(workspace,radar),[]);
});
test('unchanged observations preserve decisions; changed content refreshes the existing ID; older snapshots cannot overwrite',()=>{
 const {workspace,radar}=fixtures();const change=opportunityIntake(workspace,radar)[0];if(change.type!=='add-job')throw Error();workspace.jobs.push({...structuredClone(change.job),alignment:'primary',eligibility:'confirmed',shortlisted:true});assert.deepEqual(opportunityIntake(workspace,radar),[]);
 radar.inbox[0].posting.description='Changed frontend scope';const changes=opportunityIntake(workspace,radar);assert.equal(changes[0].type,'refresh-job');if(changes[0].type==='refresh-job')assert.equal(changes[0].id,change.job.id);
 radar.inbox[0].posting.source.fetchedAt='2026-10-04T00:00:00Z';assert.deepEqual(opportunityIntake(workspace,radar),[]);
});
test('missing observations, nonmatches and explicitly excluded companies do not create jobs',()=>{
 const {workspace,radar}=fixtures();radar.inbox[0].missingCount=1;assert.deepEqual(opportunityIntake(workspace,radar),[]);radar.inbox[0].missingCount=0;workspace.tiers.frontend={acme:'excluded'};assert.deepEqual(opportunityIntake(workspace,radar),[]);workspace.tiers={};radar.inbox[0].posting.title='Engineering Manager';assert.deepEqual(opportunityIntake(workspace,radar),[]);
});

test('source whitespace normalization does not repeatedly refresh jobs or erase review decisions',()=>{
 const {workspace,radar}=fixtures();radar.inbox[0].posting.title+=' ';radar.inbox[0].posting.company=' Acme ';const change=opportunityIntake(workspace,radar)[0];if(change.type!=='add-job')throw Error();workspace.jobs.push({...change.job,alignment:'primary',eligibility:'confirmed'});assert.deepEqual(opportunityIntake(workspace,radar),[]);
});
