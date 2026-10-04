import { createRadarService,createWorkspaceStore,createNotificationService } from '@jobradar/services';
const url=process.env.DATABASE_URL;
if(!url)throw new Error('Set DATABASE_URL to run the discovery worker.');
const radar=createRadarService(url);const store=createWorkspaceStore(url);const notifications=createNotificationService(url,new URL('../../../.local/mail-outbox',import.meta.url).pathname);
let stopped=false;let timer:ReturnType<typeof setTimeout>|undefined;let active:Promise<void>=Promise.resolve();
async function run(){active=(async()=>{await radar.tick();await notifications.queue(await store.read(),await radar.readForNotifications());await notifications.deliver();})().catch(error=>console.error('Radar tick failed; will retry in one minute.',error));await active;if(!stopped)timer=setTimeout(()=>void run().catch(console.error),60000);}
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,async()=>{stopped=true;if(timer)clearTimeout(timer);await active;await radar.close();await store.close();await notifications.close();});
if(process.env.RADAR_ONCE==='1'){try{await radar.tick();}finally{await radar.close();await store.close();await notifications.close();}}
else {console.info('JobRadar worker: checking enabled board schedules every minute.');await run();}
