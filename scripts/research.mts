import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

// Uses the same server and validation as an attached MCP client. No paid adapter.
const allowed=new Set(['get_source_coverage','get_research_plan','list_profiles','list_opportunities','list_discovery_candidates','preview_public_job_url','import_external_jobs','save_recruiter_contacts']);
const [name,inputPath]=process.argv.slice(2);
if(!allowed.has(name??''))throw new Error('Usage: npm run research -- <tool> <arguments.json>. See docs/research-operations.md for allowed tools.');
if(!inputPath)throw new Error('Provide a local JSON arguments file; keep research and personal data under ignored .local/.');
const args=JSON.parse(await readFile(inputPath,'utf8'));
const cwd=fileURLToPath(new URL('../apps/api/',import.meta.url));
const client=new Client({name:'jobradar-local-research',version:'1'});
const transport=new StdioClientTransport({command:process.execPath,args:['--env-file-if-exists=../../.env','--import','tsx','src/mcp.ts'],cwd,stderr:'pipe'});
try{
 await client.connect(transport);
 const result=await client.callTool({name,arguments:args});
 for(const block of result.content as Array<{type:string;text?:string}>)if(block.type==='text')process.stdout.write(block.text+'\n');
 if(result.isError)process.exitCode=1;
}finally{await client.close();}
