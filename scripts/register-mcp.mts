import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {homedir} from 'node:os';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');const directory=resolve(homedir(),'.codex');const path=resolve(directory,'config.toml');
const block=`[mcp_servers.jobradar]\ncommand = ${JSON.stringify(process.execPath)}\nargs = ["--env-file-if-exists=../../.env", "--import", "tsx", "src/mcp.ts"]\ncwd = ${JSON.stringify(resolve(root,'apps/api'))}\n`;
await mkdir(directory,{recursive:true});let previous='';try{previous=await readFile(path,'utf8');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
if(/^\[mcp_servers\.jobradar\]/m.test(previous)){const section=previous.split('[mcp_servers.jobradar]')[1]?.split(/\n\[/)[0]?.trim();if(section===block.split('[mcp_servers.jobradar]')[1].trim()){await mkdir(resolve(root,'.local'),{recursive:true});await writeFile(resolve(root,'.local/mcp-registration.json'),JSON.stringify({registeredAt:new Date().toISOString()}),{mode:0o600});}console.log('JobRadar MCP is already configured; existing configuration preserved.');process.exit(0);}
if(previous){const backup=resolve(directory,`config.toml.jobradar-backup-${Date.now()}`);await copyFile(path,backup);}
await writeFile(path,previous.trimEnd()+'\n\n'+block,{mode:0o600});await mkdir(resolve(root,'.local'),{recursive:true});await writeFile(resolve(root,'.local/mcp-registration.json'),JSON.stringify({registeredAt:new Date().toISOString()}),{mode:0o600});console.log('Registered JobRadar MCP. Reload the client to discover its tools. Existing settings were preserved.');
