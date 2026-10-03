import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createWorkspaceStore,createRadarService } from '@jobradar/services';
import { createMcpServer } from './mcp-server';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL required. Run from apps/api with the root .env file.');
const store=createWorkspaceStore(process.env.DATABASE_URL);
const radar=createRadarService(process.env.DATABASE_URL);
const server=createMcpServer(store,radar);
await server.connect(new StdioServerTransport());
async function close(){await server.close();await store.close();await radar.close();process.exit(0);}
process.on('SIGINT',close);process.on('SIGTERM',close);
