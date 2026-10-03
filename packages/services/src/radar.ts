import postgres from 'postgres';
import { randomUUID, createHash } from 'node:crypto';
import { fetchBoard } from '@jobradar/integrations';
import { boardSchema, radarSchema, scheduleInputSchema, type JobBoard } from '@jobradar/contracts';
import { postingContentChanged } from '@jobradar/domain';
export class ScanBusy extends Error {}
export function createRadarService(url:string,fetcher:(board:JobBoard)=>ReturnType<typeof fetchBoard>=fetchBoard) {
 const sql=postgres(url,{max:3});
 async function ensure(){await sql`INSERT INTO scan_schedules(board_id) SELECT id FROM job_boards ON CONFLICT DO NOTHING`;}
 async function read(){await ensure();const [schedules,runs,inbox]=await Promise.all([
  sql`SELECT board_id AS "boardId",enabled,interval_minutes AS "intervalMinutes",next_run_at AS "nextRunAt",lease_until AS "leaseUntil" FROM scan_schedules ORDER BY board_id`,
  sql`SELECT id,board_id AS "boardId",status,started_at AS "startedAt",finished_at AS "finishedAt",message,count,new_count AS "newCount",changed_count AS "changedCount" FROM scan_runs ORDER BY started_at DESC LIMIT 100`,
  sql`SELECT id,board_id AS "boardId",posting,version,first_seen_at AS "firstSeenAt",last_seen_at AS "lastSeenAt",changed_at AS "changedAt",change FROM discovery_inbox ORDER BY changed_at DESC`
 ]);const dates=(rows:any[])=>rows.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,value instanceof Date?value.toISOString():value])));return radarSchema.parse({schedules:dates(schedules),runs:dates(runs),inbox:dates(inbox)});}
 async function configure(input:unknown){const setting=scheduleInputSchema.parse(input);await ensure();const result=await sql`UPDATE scan_schedules SET enabled=${setting.enabled},interval_minutes=${setting.intervalMinutes},next_run_at=now() WHERE board_id=${setting.boardId} RETURNING board_id`;if(!result.length)throw new Error('Unknown company board.');return read();}
 async function scan(boardId:string,dueOnly=false){
  await ensure();const token=randomUUID();const runId=randomUUID();
  const board=await sql.begin(async tx=>{
   const [row]=await tx`SELECT b.data,s.* FROM scan_schedules s JOIN job_boards b ON b.id=s.board_id WHERE s.board_id=${boardId} FOR UPDATE OF s`;
   if(!row)throw new Error('Unknown company board.');
   if(row.lease_until && new Date(row.lease_until)>new Date())throw new ScanBusy('This board is already being scanned.');
   if(dueOnly && (!row.enabled || new Date(row.next_run_at)>new Date()))return null;
   await tx`UPDATE scan_runs SET status='failed',finished_at=now(),message='Worker lease expired; a new run is starting.' WHERE board_id=${boardId} AND status='running'`;
   await tx`UPDATE scan_schedules SET lease_until=now()+interval '90 seconds',claim_token=${token} WHERE board_id=${boardId}`;
   await tx`INSERT INTO scan_runs(id,board_id,status,started_at) VALUES (${runId},${boardId},'running',now())`;
   return boardSchema.parse(row.data);
  });if(!board)return null;
  try{
   const snapshot=await fetcher(board);
   await sql.begin(async tx=>{
    const [lease]=await tx`SELECT claim_token FROM scan_schedules WHERE board_id=${boardId} FOR UPDATE`;if(lease.claim_token!==token)throw new ScanBusy('Scan lease was replaced.');
    let newCount=0,changedCount=0;
    for(const posting of snapshot.jobs){
     const id=createHash('sha256').update(`${boardId}:${posting.source.postingId}`).digest('hex');
     const [old]=await tx`SELECT * FROM discovery_inbox WHERE id=${id}`;
     const changed=!!old&&postingContentChanged(old.posting,posting);const version=old?old.version+(changed?1:0):1;
     if(!old)newCount++;else if(changed)changedCount++;
     const changedAt=!old||changed?snapshot.fetchedAt:new Date(old.changed_at).toISOString();
     const change=old?(changed?'changed':old.change):'new';
     await tx`INSERT INTO discovery_inbox(id,board_id,posting_id,posting,version,first_seen_at,last_seen_at,changed_at,change) VALUES (${id},${boardId},${posting.source.postingId},${sql.json(posting)},${version},${old?old.first_seen_at:snapshot.fetchedAt},${snapshot.fetchedAt},${changedAt},${change}) ON CONFLICT (id) DO UPDATE SET posting=excluded.posting,version=excluded.version,last_seen_at=excluded.last_seen_at,changed_at=excluded.changed_at,change=excluded.change`;
     if(!old||changed)await tx`INSERT INTO source_observations(id,inbox_id,version,posting,captured_at) VALUES (${randomUUID()},${id},${version},${sql.json(posting)},${snapshot.fetchedAt})`;
    }
    await tx`UPDATE scan_runs SET status='succeeded',finished_at=now(),count=${snapshot.jobs.length},new_count=${newCount},changed_count=${changedCount} WHERE id=${runId}`;
    await tx`UPDATE scan_schedules SET lease_until=NULL,claim_token=NULL,next_run_at=now()+interval_minutes*interval '1 minute' WHERE board_id=${boardId}`;
   });return runId;
  }catch(e){await sql.begin(async tx=>{await tx`UPDATE scan_runs SET status='failed',finished_at=now(),message=${e instanceof Error?e.message:'Scan failed'} WHERE id=${runId}`;await tx`UPDATE scan_schedules SET lease_until=NULL,claim_token=NULL,next_run_at=now()+greatest(interval_minutes,30)*interval '1 minute' WHERE board_id=${boardId} AND claim_token=${token}`;});throw e;}
 }
 async function tick(){await ensure();const due=await sql`SELECT board_id FROM scan_schedules WHERE enabled AND next_run_at<=now() AND (lease_until IS NULL OR lease_until<=now()) ORDER BY next_run_at LIMIT 10`;for(const row of due)try{await scan(row.board_id,true);}catch(e){console.error(`Scan failed for ${row.board_id}:`,e instanceof Error?e.message:e);}}
 return {read,configure,scan,tick,close:()=>sql.end()};
}
