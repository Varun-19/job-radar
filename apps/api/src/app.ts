import { randomUUID } from 'node:crypto';
import { extractResume } from './resume-upload';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthSchema, mutationRequestSchema, resumeUploadSchema } from '@jobradar/contracts';
import { WorkspaceConflict, InvalidMutation, type WorkspaceStore } from '@jobradar/services';
export function createApp(store?:WorkspaceStore) {
 const app=Fastify({logger:true,bodyLimit:6_000_000});
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
 app.post('/resumes/upload',async(request,reply)=>{
  if(request.headers.origin && request.headers.origin!==origin)return reply.code(403).send({message:'Origin not allowed.'});
  if(!store)return reply.code(503).send({message:'Database is not configured.'});
  const parsed=resumeUploadSchema.safeParse(request.body);if(!parsed.success)return reply.code(400).send({message:'Invalid résumé upload.'});
  try{const {filename,label,base64,expectedRevision}=parsed.data;const extracted=await extractResume(filename,base64);return await store.mutate(expectedRevision,[{type:'add-resume',id:randomUUID(),filename,label,...extracted}]);}
  catch(e){if(e instanceof InvalidMutation)return reply.code(400).send({message:e.message});if(e instanceof WorkspaceConflict)return reply.code(409).send({message:e.message});throw e;}
 });
 app.get<{Params:{id:string}}>('/resumes/:id/download',async(request,reply)=>{
  const file=await store?.resumeFile?.(request.params.id);if(!file)return reply.code(404).send({message:'Résumé not found.'});
  const filename=file.metadata.filename.replace(/[^a-zA-Z0-9._-]/g,'_');
  return reply.header('Content-Disposition',`attachment; filename="${filename}"`).header('X-Content-Type-Options','nosniff').type(file.metadata.mediaType).send(Buffer.from(file.base64,'base64'));
 });
 if(store)app.addHook('onClose',async()=>{await store.close();});return app;
}
