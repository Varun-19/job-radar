# Architecture

## Decision

Use an npm-workspaces TypeScript monorepo with separate web, HTTP API, and worker applications. Next.js supplies React routing/rendering; Fastify supplies the explicit backend boundary. PostgreSQL is the canonical data store, accessed through Drizzle. The API initializes a database connection when DATABASE_URL is configured.

## Dependency direction

```text
web -> contracts
api / worker / MCP -> services -> domain + db + integrations
contracts -> Zod
```

The services package implements transactional workspace reads and writes. Source adapters live in integrations. HTTP API, scheduled worker and local stdio MCP reuse services. PostgreSQL schedules and leases coordinate scans without an external queue. MCP entry points live beside the API in `apps/api/src/mcp*.ts`.

## Persistence

Candidate evidence and résumé versions are independent of versioned search profiles. Companies and jobs are shared records; evaluations and company preferences are profile-specific. Posting revisions, evaluations, applications, and outreach history retain provenance. Opportunity status, profile disposition, application stage, and outreach state remain independent.

Unknown, not evaluated, and not applicable are distinct values. No aggregate match score replaces target alignment, professional fit, or readiness. Company preference never overrides role fit. A failed source refresh does not establish that postings have closed.

## AI constraint

No paid AI provider or automatic paid fallback. Core tracking and discovery do not depend on AI. Assisted analysis uses review-packet export/import or local MCP, subject to subscription availability and limits. Direct sign-in is an optional future capability to verify, not a dependency of this shell.

## Recruiter workflow

Contacts and recruiting evidence can exist independently of jobs. Job-contact association strength must be explicit. Outreach campaigns retain drafts, delivery records, and follow-ups independently of applications. A draft is never a sent message.

## Development security

API binds to loopback by default and allows only the configured web origin. No authentication has been implemented. This is a local personal release; it rejects non-loopback binding and foreign hosts/origins. Authentication and TLS are required before remote exposure. Server credentials may never be shipped through public web configuration.

## Current release

Migrations 0005–0009 add scheduled discovery, verified Ashby/Greenhouse coverage, pending analysis proposals, independent recruiter contacts/outreach and alert acknowledgments. Detailed operations and limits are in operations.md.

## Persistence increment

Migration 0001 introduces workspace revision, search profiles, immutable profile versions, opportunity drafts, profile-scoped company preferences, and append-only workspace activities. Draft job assessments are user-supplied; this is not yet automated classification or the final Opportunity/Application domain. The mutation endpoint validates Zod contracts and serializes writes using a locked revision row. Stale updates return 409; invalid batches roll back together. Workspace reads use a repeatable-read transaction.

Profile edits preserve previous definitions and increment version. Profile edits reset current assessments to review/unknown; previous proposals and activity remain historical. Local browser view preferences (selected profile and sort) remain local, while business data lives in PostgreSQL. Previous browser drafts remain available for explicit import; an import does not overwrite existing records or delete browser data.

No authentication is implemented yet. Bind locally only; cross-origin mutation requests are rejected, but origin checking is not a substitute for authentication before hosting.

## Tracking increment

Migration 0002 adds résumé versions, reviewed candidate evidence, and applications referencing saved opportunity drafts. Résumé metadata/text is returned in workspace snapshots; original bytes remain in the database and are available through a dedicated download route. The upload endpoint locally extracts readable PDFs and plain text, retains the original, and shares revision-checked transactions with other workspace mutations. Binary content is omitted from activity payloads.

The domain defines application correction rules. Services enforce valid job/résumé references, unique applications per job, source quotes for résumé evidence, immutable résumé series/version records, and explanatory notes for corrections. Submission dates are user supplied and stay null when unknown. The web client consumes these contracts; Today derives counts and due follow-ups from persisted records.

## Discovery increment

Migration 0003 adds persisted company board configuration and a verified Datadog seed. `/discovery/preview` uses read-only Greenhouse and Lever (global/EU) adapters with provider hosts constructed from validated tokens, disabled redirects, request timeouts, response-size limits, and runtime payload validation. HTML descriptions are decoded into plain text and rendered as text. The shared integrations package serves API and worker, now including Ashby.

The user explicitly imports selected snapshot postings through the existing transactional mutation service. Source identity is deduplicated per profile under the workspace lock; profile-specific review, shortlist, and application references remain independent. Provenance stays on the saved posting. Manual assessment mutations append activity history. No AI classifies imported postings. Explicit refreshes append immutable posting history before replacing the current snapshot; scheduled source runs retain new/changed observations without automatically importing them. Neither implies closure.

## Posting history and refresh increment

Migration 0004 adds append-only posting observations keyed by job and version. It backfills the current observation for existing sourced drafts. Imports create version 1; explicit refresh mutations validate identical provider/board/posting identity and reject older retrieval timestamps before appending a version and updating the current draft atomically. Posting content changes reset manual assessments; retrieval/update timestamps alone do not. Existing shortlist and application relationships remain unchanged. New applications pin the current posting revision when tracking starts; old records keep the missing revision unknown.

Four additional company board identities and APIs were verified before seeding their configuration: Cloudflare, Databricks, Figma, and MongoDB. The full strategic company universe remains separate from configured source coverage. Source fetching supports on-demand and enabled schedules and does not infer closure.
