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
export function opportunityGroup(job: OpportunityDraft, tier: CompanyTier): OpportunityGroup {
  if (job.alignment === 'outside' || job.eligibility === 'ineligible' || tier === 'excluded') return 'Outside target';
  if (job.alignment === 'review' || job.eligibility === 'unknown') return 'Needs review';
  if (tier === 'strategic-target') return 'Strategic targets';
  if (tier === 'target') return 'Target companies';
  return 'Discoveries';
}
export function compareOpportunities(a: OpportunityDraft, b: OpportunityDraft, tierOf: (company: string) => CompanyTier): number {
  const group = groupOrder.indexOf(opportunityGroup(a, tierOf(a.company))) - groupOrder.indexOf(opportunityGroup(b, tierOf(b.company)));
  if (group) return group;
  const alignment = { primary: 0, selective: 1, review: 2, outside: 3 };
  const fit = { strong: 0, partial: 1, unknown: 2 };
  return alignment[a.alignment] - alignment[b.alignment] || fit[a.fit] - fit[b.fit] || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
}
