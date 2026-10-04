/** Pure business concepts. No React, HTTP, database, or model-provider imports. */
export type AssessmentState = 'unknown' | 'not-evaluated' | 'not-applicable';
export type CompanyTier = 'strategic-target' | 'target' | 'watch' | 'opportunistic' | 'excluded' | 'unclassified';
export type SearchProfileId = string;

export * from './opportunities';
export * from './applications';
export * from './postings';
export * from './discovery-filter';
export * from './resume-review';
export * from './digest';
export * from './company-universe';
