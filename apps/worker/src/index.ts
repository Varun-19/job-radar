import { createRadarService } from '@jobradar/services';
const url=process.env.DATABASE_URL;
if(!url)throw new Error('Set DATABASE_URL to run the discovery worker.');
const radar=createRadarService(url);
let stopped=false;let timer:ReturnType<typeof setTimeout>|undefined;let active:Promise<void>=Promise.resolve();
async function run(){active=radar.tick();await active;if(!stopped)timer=setTimeout(()=>void run().catch(console.error),60000);}
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,async()=>{stopped=true;if(timer)clearTimeout(timer);await active;await radar.close();});
if(process.env.RADAR_ONCE==='1'){try{await radar.tick();}finally{await radar.close();}}
else {console.info('JobRadar worker: checking enabled board schedules every minute.');await run();}
