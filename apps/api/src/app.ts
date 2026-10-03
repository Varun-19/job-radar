import { fetchBoard, DiscoveryFailure } from './discovery';
import { z } from 'zod';
import { scheduleInputSchema } from '@jobradar/contracts';
import { ScanBusy, type createRadarService } from '@jobradar/services';
import { randomUUID } from 'node:crypto';
import { extractResume } from './resume-upload';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthSchema, mutationRequestSchema, resumeUploadSchema, discoveryRequestSchema } from '@jobradar/contracts';
import { WorkspaceConflict, InvalidMutation, type WorkspaceStore } from '@jobradar/services';
export function createApp(store?:WorkspaceStore,radar?:ReturnType<typeof createRadarService>) {
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
 app.get('/radar',async(_request,reply)=>radar?radar.read():reply.code(503).send({message:'Radar is not configured.'}));
 app.post('/radar/schedules',async(request,reply)=>{
  if(request.headers.origin&&request.headers.origin!==origin)return reply.code(403).send({message:'Origin not allowed.'});
  if(!radar)return reply.code(503).send({message:'Radar is not configured.'});
  const parsed=scheduleInputSchema.safeParse(request.body);if(!parsed.success)return reply.code(400).send({message:'Invalid scan schedule.'});
  try{return await radar.configure(parsed.data);}catch(e){return reply.code(400).send({message:e instanceof Error?e.message:'Invalid schedule.'});}
 });
 app.post('/radar/scan',async(request,reply)=>{
  if(request.headers.origin&&request.headers.origin!==origin)return reply.code(403).send({message:'Origin not allowed.'});
  if(!radar)return reply.code(503).send({message:'Radar is not configured.'});
  const parsed=z.object({boardId:z.string().min(1).max(100)}).safeParse(request.body);if(!parsed.success)return reply.code(400).send({message:'Choose a company board.'});
  try{await radar.scan(parsed.data.boardId);return await radar.read();}catch(e){return reply.code(e instanceof ScanBusy?409:502).send({message:e instanceof Error?e.message:'Scan failed.'});}
 });
 app.post('/discovery/preview',async(request,reply)=>{
  if(request.headers.origin && request.headers.origin!==origin)return reply.code(403).send({message:'Origin not allowed.'});
  const parsed=discoveryRequestSchema.safeParse(request.body);if(!parsed.success)return reply.code(400).send({message:'Invalid board configuration.'});
  try{return await fetchBoard(parsed.data.board);}catch(e){if(e instanceof DiscoveryFailure)return reply.code(502).send({message:e.message});throw e;}
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
 app.addHook('onClose',async()=>{await store?.close();await radar?.close();});return app;
}
