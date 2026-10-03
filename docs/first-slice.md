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

## Résumé, evidence, and application increment

Résumé import and manual application tracking are now implemented, superseding their deferred status above. Migration 0002 adds immutable résumé versions with original file bytes, source-linked evidence, and one application per saved opportunity. PDF/TXT/Markdown extraction runs locally; readable PDFs are supported, while scanned PDFs need separately supplied text. No AI claims are generated.

Evidence is manually reviewed. Résumé evidence requires an exact source version and a quote present in the extracted text. Applications retain a selected résumé version, explicit or unknown submission date, follow-up date, stage, and append-only notes. Backward/reopened transitions and post-preparation résumé/date corrections require an explanation. Today uses actual saved records and India-time follow-ups.

Validation covers local PDF/text extraction, invalid inputs, immutable versions and original byte retrieval, evidence provenance, application uniqueness, correction invariants, transaction rollback, and unknown dates. Live sources, semantic interpretation, MCP, and recruiter/outreach workflows remain deferred.

## On-demand live discovery increment

Live board discovery is now available for Greenhouse, Lever, and Lever EU, superseding the blanket live-source deferral above. Saved company boards are shared across search profiles. The UI fetches a snapshot, filters titles and locations, and explicitly imports selected postings with provenance. Duplicate imports are rejected for a profile; other profiles may import the same source identity. Imports begin in Needs review with unknown fit/eligibility. Manual assessment editing is available in the job detail.

Tests cover provider payload normalization, encoded descriptions, prospect-post exclusion, source timestamp preservation, source URL validation, request host construction, upstream failures, origin/input rejection, board persistence, duplicate import rejection, cross-profile imports, and assessment history. Datadog’s live public board was also fetched without importing jobs. Scheduled discovery, broad company-board mapping, posting revisions/closure, AI interpretation, MCP, and recruiter outreach remain deferred.
