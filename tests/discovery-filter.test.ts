import { test } from 'node:test';
import assert from 'node:assert/strict';
import { candidateSignals,discoveryRoleRank } from '@jobradar/domain';
const criteria={levelTerms:['Staff'],roleTerms:['frontend','React'],locationTerms:['Bengaluru','Bangalore','India'],excludedTitleTerms:['manager']};
test('profile retrieval requires configured level, role, and location groups',()=>{
 assert.equal(candidateSignals({title:'Staff Engineer',description:'Own React frontend platform',location:'Bengaluru'},criteria).candidate,true);
 assert.equal(candidateSignals({title:'Senior Frontend Engineer',description:'React',location:'Bangalore'},criteria).candidate,false);
 assert.equal(candidateSignals({title:'Staff Storage Engineer',description:'Replication and compaction',location:'India'},criteria).candidate,false);
 assert.equal(candidateSignals({title:'Staff Frontend Engineer',description:'React',location:'Remote, USA'},criteria).candidate,false);
 const sap={levelTerms:[],roleTerms:['SAP'],locationTerms:['India'],excludedTitleTerms:[]};
 assert.equal(candidateSignals({title:'Consultant',description:'SAP S/4HANA implementation',location:'India'},sap).candidate,true);
});
test('terms match words and frontend separators without excluding internal-platform roles as interns',()=>{
 const c={...criteria,excludedTitleTerms:['intern']};
 assert.equal(candidateSignals({title:'Staff Front-End Engineer — Internal tools',description:'Platform',location:'India'},c).candidate,true);
 assert.equal(candidateSignals({title:'Staffing coordinator',description:'React',location:'India'},c).candidate,false);
 assert.equal(candidateSignals({title:'Staff Engineer',description:'Reacting to alerts',location:'India'},c).candidate,false);
 assert.equal(candidateSignals({title:'Staff Frontend Intern',description:'React',location:'India'},c).candidate,false);
});
test('a generic UI mention in a description does not retrieve an unrelated staff role',()=>{
 const c={...criteria,roleTerms:['frontend','React','UI']};
 const unrelated={title:'Staff Machine Learning Engineer',description:'Partner with UI designers',location:'India'};
 assert.equal(candidateSignals(unrelated,c).candidate,false);assert.equal(discoveryRoleRank(unrelated,c),2);
 assert.equal(candidateSignals({...unrelated,title:'Staff UI Engineer'},c).candidate,true);
});
