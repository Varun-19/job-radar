# First slice

## Implemented

- Responsive UI layout and navigable shells for Today, opportunities, applications, recruiter hunt, profiles, evidence, and companies.
- A client-side backend connectivity indicator validated with the shared health contract.
- Fastify API factory, health endpoint, CORS origin configuration, graceful shutdown.
- Explicit worker shell.
- Shared contract, domain, and database package boundaries.
- Optional local PostgreSQL Compose service.
- Workspace commands, lockfile, type checking, production UI build, and API smoke tests.

## Deferred

Database schema/migrations, queue consumers, profile forms, persistent records, supplied company-universe import, résumé import, live source adapters, MCP, AI analysis, alerts, and outreach delivery. The UI intentionally has empty states rather than fabricated jobs or counts.

The reviewed specification calls for classification review before automated semantic analysis. That remains a future milestone.

## Opportunity workbench increment

The opportunity route now implements a responsive list/detail interface, company-first grouping, profile switching, manual draft entry, shortlisting, search/company filters, queue filters, and saved per-profile sort preferences. The company route preserves the supplied historical universe and supports per-profile tier editing. All company tiers begin unclassified.

This increment stores drafts/preferences in browser localStorage, not PostgreSQL. It is a UI workflow preview and not canonical application tracking. Staff and SAP are selectable presets; full profile editing is still deferred. No jobs are fetched automatically. Assessments are manually entered and default to review/unknown. The optional example preview uses fictional jobs and preferences and does not import them into saved records.

Ordering: relevant strategic targets, relevant targets, discoveries, needs review, outside target. Unknown eligibility enters review; explicit ineligibility, outside-role alignment, and excluded companies enter outside target. Within relevant groups: role alignment, professional fit, freshness. Newest-first is an explicit user override. Tests cover company priority, profile-specific tiers, exclusion, and eligibility gates.

## PostgreSQL and search-profile increment

The local-draft persistence limitation above is superseded: jobs, tiers, and editable profiles now persist through the API in PostgreSQL. Profile selection and sort remain browser view preferences. Staff and exploratory SAP presets are seeded from shared contracts, with create, edit, and duplicate forms for additional directions. Profile definitions have immutable versions; writes create activity records.

Legacy browser records remain intact and can be explicitly imported. Current empty-state/example data is never imported automatically. Source feeds, résumé evidence, application lifecycle, and outreach workflows remain deferred.

Validation covers stale revisions, atomic rollback, invalid payloads, unexpected origins, profile version history, and persistence after reconnecting.
