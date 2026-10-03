import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {once} from 'node:events';
const root=resolve(import.meta.dirname,'..');process.chdir(root);
const db=spawn('/bin/sh',['scripts/db-local.sh','start'],{cwd:root,stdio:'inherit'});const [code]=await once(db,'exit');if(code!==0)throw new Error('Local PostgreSQL startup failed.');
const children=[
 spawn(process.execPath,[resolve(root,'node_modules/next/dist/bin/next'),'start','--hostname','localhost'],{cwd:resolve(root,'apps/web'),stdio:'inherit'}),
 spawn(process.execPath,['--env-file-if-exists=../../.env','--import','tsx','src/index.ts'],{cwd:resolve(root,'apps/api'),stdio:'inherit'}),
 spawn(process.execPath,['--env-file-if-exists=../../.env','--import','tsx','src/index.ts'],{cwd:resolve(root,'apps/worker'),stdio:'inherit'})
];
let stopping=false;function stop(exitCode:number){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');setTimeout(()=>process.exit(exitCode),2000).unref();}
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>stop(0));for(const child of children){child.once('error',error=>{console.error(error.message);stop(1);});child.once('exit',code=>{if(!stopping)stop(code??1);});}
