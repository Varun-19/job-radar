import { test } from 'node:test';
import assert from 'node:assert/strict';
import { candidateSignals } from '@jobradar/domain';
const criteria={levelTerms:['Staff'],roleTerms:['frontend','React'],locationTerms:['Bengaluru','Bangalore','India'],excludedTitleTerms:['manager']};
test('profile retrieval requires configured level, role, and location groups',()=>{
 assert.equal(candidateSignals({title:'Staff Engineer',description:'Own React frontend platform',location:'Bengaluru'},criteria).candidate,true);
 assert.equal(candidateSignals({title:'Senior Frontend Engineer',description:'React',location:'Bangalore'},criteria).candidate,false);
 assert.equal(candidateSignals({title:'Staff Storage Engineer',description:'Replication and compaction',location:'India'},criteria).candidate,false);
 assert.equal(candidateSignals({title:'Staff Frontend Engineer',description:'React',location:'Remote, USA'},criteria).candidate,false);
 const sap={levelTerms:[],roleTerms:['SAP'],locationTerms:['India'],excludedTitleTerms:[]};
 assert.equal(candidateSignals({title:'Consultant',description:'SAP S/4HANA implementation',location:'India'},sap).candidate,true);
});
