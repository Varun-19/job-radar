import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialProfiles,workspaceSchema,radarSchema,workspaceAlerts } from '@jobradar/contracts';
test('alerts retain new versions while acknowledgments hide only the exact notice',()=>{
 const workspace=workspaceSchema.parse({revision:0,profiles:initialProfiles,jobs:[],tiers:{}});
 const posting={company:'Fixture',title:'Staff Frontend',location:'India',url:'https://example.com/job',description:'Frontend',source:{provider:'greenhouse',board:'fixture',postingId:'1',updatedAt:null,fetchedAt:'2026-10-03T12:00:00Z'}};
 const radar=radarSchema.parse({schedules:[],runs:[],inbox:[{id:'candidate',boardId:'fixture',posting,version:1,firstSeenAt:posting.source.fetchedAt,lastSeenAt:posting.source.fetchedAt,changedAt:posting.source.fetchedAt,change:'new'}]});
 const alerts=workspaceAlerts(workspace,radar,'2026-10-03','staff');assert.equal(alerts.length,1);workspace.dismissedAlerts.push(alerts[0].id);assert.equal(workspaceAlerts(workspace,radar,'2026-10-03','staff').length,0);radar.inbox[0].version=2;assert.equal(workspaceAlerts(workspace,radar,'2026-10-03','staff').length,1);
});
