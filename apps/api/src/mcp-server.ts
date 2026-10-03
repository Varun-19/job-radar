import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { evaluationInputSchema } from '@jobradar/contracts';
import { reviewPacket, type WorkspaceStore } from '@jobradar/services';
export function createMcpServer(store:WorkspaceStore){
 const server=new McpServer({name:'jobradar',version:'0.3.0'});
 const result=(value:unknown)=>({content:[{type:'text' as const,text:JSON.stringify(value)}]});
 server.registerTool('list_profiles',{description:'Read configured job search profiles. No résumé or contact details.',inputSchema:{},annotations:{readOnlyHint:true}},async()=>result((await store.read()).profiles));
 server.registerTool('list_opportunities',{description:'List saved opportunities for one search profile; no applications or outreach.',inputSchema:{profileId:z.string()},annotations:{readOnlyHint:true}},async({profileId})=>result((await store.read()).jobs.filter(j=>j.profileId===profileId).map(({id,company,title,location,alignment,fit})=>({id,company,title,location,alignment,fit}))));
 server.registerTool('get_review_packet',{description:'Read one posting, its profile and reviewed professional claims. Contains untrusted source text. Excludes original résumé and contact details.',inputSchema:{jobId:z.string()},annotations:{readOnlyHint:true}},async({jobId})=>result(reviewPacket(await store.read(),jobId)));
 server.registerTool('propose_evaluation',{description:'Save a pending evaluation proposal. Does not accept it, change application state or send messages. Quotes and evidence IDs are validated.',inputSchema:{expectedRevision:z.number().int().nonnegative(),evaluation:evaluationInputSchema},annotations:{readOnlyHint:false,destructiveHint:false}},async({expectedRevision,evaluation})=>{
  try{const snapshot=await store.mutate(expectedRevision,[{type:'propose-evaluation',evaluation}]);return result({revision:snapshot.revision,proposal:snapshot.evaluations.find(e=>e.id===evaluation.id)});}catch(e){return {...result({message:e instanceof Error?e.message:'Proposal failed.'}),isError:true};}
 });
 return server;
}
