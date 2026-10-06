import type { CompanyTier } from './index';
export type Alignment = 'primary' | 'selective' | 'review' | 'outside';
export type Fit = 'strong' | 'partial' | 'unknown';
export type Eligibility = 'confirmed' | 'unknown' | 'ineligible';
export interface OpportunityDraft {
  id: string; profileId: string; company: string; title: string; location: string;
  description: string; url: string; alignment: Alignment; fit: Fit;
  eligibility: Eligibility; createdAt: string; shortlisted: boolean;
}
export type OpportunityGroup = 'Strategic targets' | 'Target companies' | 'Discoveries' | 'Needs review' | 'Outside target';
export const groupOrder: OpportunityGroup[] = ['Strategic targets', 'Target companies', 'Discoveries', 'Needs review', 'Outside target'];
export function opportunityGroup(job: OpportunityDraft, tier: CompanyTier, currentDiscoveryMatch=true): OpportunityGroup {
  if (job.alignment === 'outside' || job.eligibility === 'ineligible' || tier === 'excluded') return 'Outside target';
  if (!currentDiscoveryMatch && job.alignment==='review' && job.fit==='unknown' && job.eligibility==='unknown') return 'Outside target';
  if (job.alignment === 'review' || job.eligibility === 'unknown') return 'Needs review';
  if (tier === 'strategic-target') return 'Strategic targets';
  if (tier === 'target') return 'Target companies';
  return 'Discoveries';
}
export function compareOpportunities(a: OpportunityDraft, b: OpportunityDraft, tierOf: (company: string) => CompanyTier, roleRank?: (job:OpportunityDraft)=>number,currentDiscoveryMatch?: (job:OpportunityDraft)=>boolean): number {
  const group = groupOrder.indexOf(opportunityGroup(a, tierOf(a.company),currentDiscoveryMatch?.(a))) - groupOrder.indexOf(opportunityGroup(b, tierOf(b.company),currentDiscoveryMatch?.(b)));
  if (group) return group;
  const tiers:Record<CompanyTier,number>={'strategic-target':0,target:1,watch:2,opportunistic:3,unclassified:4,excluded:5};
  const preference=tiers[tierOf(a.company)]-tiers[tierOf(b.company)];if(preference)return preference;
  const alignment = { primary: 0, selective: 1, review: 2, outside: 3 };
  const fit = { strong: 0, partial: 1, unknown: 2 };
  return alignment[a.alignment] - alignment[b.alignment] || fit[a.fit] - fit[b.fit] || (roleRank?roleRank(a)-roleRank(b):0) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
}
