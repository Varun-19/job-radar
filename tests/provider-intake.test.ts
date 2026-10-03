import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeExternalPostings} from '@jobradar/contracts';
const row={provider:'linkedin',company:'Employer',title:'Staff Frontend',location:'Bengaluru',description:'Actual source text',url:'https://www.linkedin.com/jobs/view/123?trackingId=test&utm_source=feed'};
test('provider intake retains exact text, attribution and stable tracking-free identity',()=>{const [j]=normalizeExternalPostings([row],'2026-10-04T00:00:00Z');assert.equal(j.description,row.description);assert.equal(j.url,'https://www.linkedin.com/jobs/view/123');assert.equal(j.source.postingId,j.url);assert.equal(j.source.provider,'linkedin');});
test('provider intake rejects impersonated domains and unsafe URLs before mutations',()=>{for(const url of ['https://linkedin.com.attacker.example/jobs/123','http://linkedin.com/jobs/123','https://user:secret@linkedin.com/jobs/123','javascript:alert(1)'])assert.throws(()=>normalizeExternalPostings([{...row,url}]));assert.throws(()=>normalizeExternalPostings([{...row,description:''}]));});
