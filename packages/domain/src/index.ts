/** Pure business concepts. No React, HTTP, database, or model-provider imports. */
export type AssessmentState = 'unknown' | 'not-evaluated' | 'not-applicable';
export type CompanyTier = 'strategic-target' | 'target' | 'watch' | 'opportunistic' | 'excluded' | 'unclassified';
export type SearchProfileId = string;
