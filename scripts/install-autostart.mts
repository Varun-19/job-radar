import {mkdir,writeFile,readFile,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {homedir} from 'node:os';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');const label='com.varun.jobradar';const directory=resolve(homedir(),'Library/LaunchAgents');const file=resolve(directory,label+'.plist');const logs=resolve(root,'.local/logs');
const xml=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const path=[dirname(process.execPath),'/opt/homebrew/bin','/usr/bin','/bin','/usr/sbin','/sbin'].join(':');
const plist=`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>Label</key><string>${label}</string><key>ProgramArguments</key><array>${[process.execPath,'--import','tsx',resolve(root,'scripts/run-local.mts')].map(s=>`<string>${xml(s)}</string>`).join('')}</array><key>WorkingDirectory</key><string>${xml(root)}</string><key>EnvironmentVariables</key><dict><key>PATH</key><string>${xml(path)}</string></dict><key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>30</integer><key>StandardOutPath</key><string>${xml(resolve(logs,'service.log'))}</string><key>StandardErrorPath</key><string>${xml(resolve(logs,'service-error.log'))}</string></dict></plist>`;
await mkdir(directory,{recursive:true});await mkdir(logs,{recursive:true,mode:0o700});
try{const existing=await readFile(file,'utf8');if(existing!==plist)await copyFile(file,`${file}.backup-${Date.now()}`);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
await writeFile(file,plist,{mode:0o600});execFileSync('/usr/bin/plutil',['-lint',file],{stdio:'inherit'});
try{execFileSync('/bin/launchctl',['print',`gui/${process.getuid!()}/${label}`],{stdio:'ignore'});console.log('JobRadar autostart already loaded; configuration written. Reload it after stopping the existing service if paths changed.');}catch{execFileSync('/bin/launchctl',['bootstrap',`gui/${process.getuid!()}`,file],{stdio:'inherit'});console.log('JobRadar autostart installed and loaded.');}
