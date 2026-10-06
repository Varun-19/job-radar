import {z} from 'zod';
import {boardSchema} from './discovery';
import {scanRunSchema} from './radar';
import {candidateSignals} from '@jobradar/domain';
import type {WorkspaceSnapshot} from './workspace';
export const sourceCoverageSchema=z.object({
 sources:z.array(z.object({board:boardSchema,enabled:z.boolean(),latestRun:scanRunSchema.nullable(),observed:z.number(),missing:z.number(),shortDescriptions:z.number()})),
 companyBoards:z.number(),remoteFeeds:z.number(),universeCompanies:z.number(),coveredUniverseCompanies:z.number(),uncoveredCompanies:z.array(z.string()),
 assistedProviders:z.array(z.string()),
});
export type SourceCoverage=z.infer<typeof sourceCoverageSchema>;
export const opportunityObservationsSchema=z.array(z.object({jobId:z.string(),lastSeenAt:z.iso.datetime(),missingCount:z.number().int().nonnegative(),lastMissingAt:z.iso.datetime().nullable()}));
export type OpportunityObservation=z.infer<typeof opportunityObservationsSchema>[number];
/** Retain reviewed decisions and explicit external imports; recheck automatic, unassessed source leads. */
export function currentDiscoveryMatch(job:WorkspaceSnapshot['jobs'][number],profile:WorkspaceSnapshot['profiles'][number]|undefined,boards:WorkspaceSnapshot['boards']){
 if(!profile?.discovery||job.alignment!=='review'||job.fit!=='unknown'||job.eligibility!=='unknown'||job.evaluationId)return true;
 if(!boards.some(b=>b.provider===job.source?.provider&&b.token===job.source?.board))return true;
 return candidateSignals(job,profile.discovery).candidate;
}
