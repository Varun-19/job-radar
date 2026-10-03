import { execFileSync } from 'node:child_process';
import { mkdir,chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import postgres from 'postgres';
const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL required.');
const parsed=new URL(url);const env={...process.env,PGHOST:parsed.hostname,PGPORT:parsed.port||'5432',PGUSER:decodeURIComponent(parsed.username),PGPASSWORD:decodeURIComponent(parsed.password),PGDATABASE:parsed.pathname.slice(1)};
const mode=process.argv[2];
if(mode==='backup'){
 await mkdir('.local/backups',{recursive:true,mode:0o700});
 const path=resolve('.local/backups',`jobradar-${new Date().toISOString().replaceAll(':','-')}.dump`);
 execFileSync('pg_dump',['--format=custom','--no-owner','--file',path],{env,stdio:['ignore','ignore','inherit']});await chmod(path,0o600);console.log(path);
}else if(mode==='restore'){
 const path=process.argv[3],name=process.argv[4];if(!path||!/^jobradar_restore_[a-z0-9_]+$/.test(name??''))throw new Error('Use db:restore -- <dump path> jobradar_restore_<name>. Restores create a new database only.');
 const admin=postgres(url,{max:1});try{await admin.unsafe(`CREATE DATABASE "${name}"`);try{execFileSync('pg_restore',['--exit-on-error','--single-transaction','--no-owner','--dbname',name,resolve(path)],{env,stdio:['ignore','ignore','inherit']});console.log(`Restored into new database ${name}. The original database is unchanged.`);}catch(e){console.error(`Restore failed. Inspect or remove the new database ${name}; the original was not modified.`);throw e;}}finally{await admin.end();}
}else throw new Error('Use backup or restore.');
