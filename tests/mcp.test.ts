import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../apps/api/src/mcp-server';
import { initialProfiles, workspaceSchema } from '@jobradar/contracts';
test('MCP exposes only scoped reads and pending proposals, excluding original résumé data',async()=>{
 const snapshot=workspaceSchema.parse({revision:1,profiles:initialProfiles,tiers:{},jobs:[{id:'test',profileId:'staff',company:'Fixture',title:'Staff Frontend',location:'India',description:'Frontend scope',url:'',alignment:'review',fit:'unknown',eligibility:'unknown',createdAt:new Date().toISOString(),shortlisted:false}],resumes:[{id:'private',label:'Private',version:1,filename:'private.txt',mediaType:'text/plain',text:'PRIVATE_CONTACT_SENTINEL',sha256:'test',createdAt:new Date().toISOString()}]});
 const server=createMcpServer({read:async()=>snapshot,mutate:async()=>snapshot,close:async()=>{}});
 const client=new Client({name:'test',version:'1'});const [a,b]=InMemoryTransport.createLinkedPair();
 try{await server.connect(a);await client.connect(b);const tools=await client.listTools();assert.deepEqual(tools.tools.map(t=>t.name).sort(),['get_review_packet','list_opportunities','list_profiles','propose_evaluation']);const packet=await client.callTool({name:'get_review_packet',arguments:{jobId:'test'}});assert.ok(!JSON.stringify(packet).includes('PRIVATE_CONTACT_SENTINEL'));assert.ok(JSON.stringify(packet).includes('Frontend scope'));}finally{await client.close();await server.close();}
});
