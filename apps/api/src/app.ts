import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthSchema, mutationRequestSchema } from '@jobradar/contracts';
import { WorkspaceConflict, InvalidMutation, type WorkspaceStore } from '@jobradar/services';
export function createApp(store?:WorkspaceStore) {
 const app=Fastify({logger:true,bodyLimit:2_000_000});
 const origin=process.env.WEB_ORIGIN??'http://localhost:3000';
 app.register(cors,{origin});
 app.get('/health',async (_request,reply)=>{let database:'connected'|'unavailable'|'not-configured'=store?'connected':'not-configured';if(store)try{await store.read();}catch{database='unavailable';reply.code(503);}return healthSchema.parse({status:database==='unavailable'?'degraded':'ok',service:'jobradar-api',version:'0.2.0',database});});
 app.get('/workspace',async (_request,reply)=>{if(!store)return reply.code(503).send({message:'Database is not configured.'});return store.read();});
 app.post('/workspace/mutations',async(request,reply)=>{
  // CORS alone does not block writes from another origin.
  if(request.headers.origin && request.headers.origin!==origin)return reply.code(403).send({message:'Origin not allowed.'});
  if(!store)return reply.code(503).send({message:'Database is not configured.'});
  const parsed=mutationRequestSchema.safeParse(request.body);if(!parsed.success)return reply.code(400).send({message:'Invalid workspace mutation.',issues:parsed.error.issues});
  try{return await store.mutate(parsed.data.expectedRevision,parsed.data.mutations);}catch(e){if(e instanceof WorkspaceConflict)return reply.code(409).send({message:e.message});if(e instanceof InvalidMutation)return reply.code(400).send({message:e.message});throw e;}
 });
 if(store)app.addHook('onClose',async()=>{await store.close();});return app;
}
