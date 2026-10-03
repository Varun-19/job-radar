import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../apps/api/src/app';
import { initialProfiles } from '@jobradar/contracts';
import { WorkspaceConflict, type WorkspaceStore } from '@jobradar/services';
const store:WorkspaceStore={read:async()=>({revision:0,profiles:initialProfiles,tiers:{},jobs:[]}),mutate:async()=>{throw new WorkspaceConflict('Stale revision');},close:async()=>{}};
test('workspace rejects invalid payloads and unexpected browser origins',async()=>{const app=createApp(store);try{assert.equal((await app.inject({method:'POST',url:'/workspace/mutations',payload:{}})).statusCode,400);assert.equal((await app.inject({method:'POST',url:'/workspace/mutations',headers:{origin:'https://other.example'},payload:{}})).statusCode,403);}finally{await app.close();}});
test('workspace exposes conflicts rather than overwriting',async()=>{const app=createApp(store);try{const response=await app.inject({method:'POST',url:'/workspace/mutations',payload:{expectedRevision:0,mutations:[{type:'set-tier',profileId:'staff',company:'Adobe',tier:'target'}]}});assert.equal(response.statusCode,409);}finally{await app.close();}});
