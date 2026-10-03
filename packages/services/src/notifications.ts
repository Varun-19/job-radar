import postgres from 'postgres';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import nodemailer from 'nodemailer';
import {buildDigest,digestPeriod} from '@jobradar/domain';
import type {WorkspaceSnapshot,RadarSnapshot} from '@jobradar/contracts';
export function createNotificationService(url:string,outboxDirectory:string){
 const sql=postgres(url,{max:2});
 async function queue(workspace:WorkspaceSnapshot,radar:RadarSnapshot,now=new Date()){
  const indianHour=Number(now.toLocaleString('en-GB',{timeZone:'Asia/Kolkata',hour:'numeric',hourCycle:'h23'}));if(indianHour<9)return;
  for(const profile of workspace.profiles)for(const kind of ['daily','weekly'] as const){
   if(kind==='weekly'&&now.toLocaleDateString('en-US',{timeZone:'Asia/Kolkata',weekday:'short'})!=='Mon')continue;
   const digest=buildDigest(workspace,radar,profile.id,kind,now);if(!digest)continue;
   const period=digestPeriod(now,kind);const id=createHash('sha256').update(`${profile.id}:${kind}:${period}`).digest('hex');
   await sql`INSERT INTO notification_outbox(id,profile_id,kind,period,subject,body) VALUES (${id},${profile.id},${kind},${period},${digest.subject},${digest.body}) ON CONFLICT DO NOTHING`;
  }
  await mkdir(outboxDirectory,{recursive:true,mode:0o700});
  const rows=await sql`SELECT id,subject,body,status FROM notification_outbox WHERE status!='sent' ORDER BY created_at DESC LIMIT 100`;
  for(const row of rows)await writeFile(resolve(outboxDirectory,`${row.id}.json`),JSON.stringify(row,null,2),{mode:0o600});
 }
 async function deliver(env:NodeJS.ProcessEnv=process.env){
  const {SMTP_HOST,SMTP_USER,SMTP_PASSWORD,SMTP_FROM,JOBRADAR_ALERT_EMAIL}=env;if(!SMTP_HOST||!SMTP_FROM||!JOBRADAR_ALERT_EMAIL)return {configured:false,sent:0};
  const email=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;if(!email.test(SMTP_FROM)||!email.test(JOBRADAR_ALERT_EMAIL))throw new Error('Configure valid sender and recipient email addresses.');
  const port=Number(env.SMTP_PORT??465);if(![465,587].includes(port))throw new Error('SMTP must use TLS on port 465 or STARTTLS on port 587.');
  const transport=nodemailer.createTransport({host:SMTP_HOST,port,secure:port===465,requireTLS:true,...(SMTP_USER&&SMTP_PASSWORD?{auth:{user:SMTP_USER,pass:SMTP_PASSWORD}}:{}),connectionTimeout:15000,socketTimeout:30000});let sent=0;
  try{
   // Expired sends need manual review: an SMTP timeout can occur after a provider accepted a message.
   await sql`UPDATE notification_outbox SET status='failed',error='Delivery interrupted; check provider delivery before retrying.',lease_until=NULL WHERE status='sending' AND lease_until<now()`;
   for(let i=0;i<10;i++){
    const rows=await sql.begin(async tx=>{const [row]=await tx`SELECT * FROM notification_outbox WHERE status='pending' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`;if(!row)return [];await tx`UPDATE notification_outbox SET status='sending',lease_until=now()+interval '5 minutes' WHERE id=${row.id}`;return [row];});const row=rows[0];if(!row)break;
    try{await transport.sendMail({from:SMTP_FROM,to:JOBRADAR_ALERT_EMAIL,subject:row.subject,text:row.body,messageId:`<${row.id}@jobradar.local>`});await sql`UPDATE notification_outbox SET status='sent',sent_at=now(),lease_until=NULL,error=NULL WHERE id=${row.id}`;sent++;}
    catch{await sql`UPDATE notification_outbox SET status='failed',lease_until=NULL,error='SMTP delivery failed. Check credentials and provider delivery before retrying.' WHERE id=${row.id}`;}
   }
  }finally{transport.close();}return {configured:true,sent};
 }
 async function read(){return sql`SELECT id,profile_id AS "profileId",kind,period,subject,status,created_at AS "createdAt",sent_at AS "sentAt",error FROM notification_outbox ORDER BY created_at DESC LIMIT 100`;}
 return {queue,deliver,read,close:()=>sql.end()};
}
