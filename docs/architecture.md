# Architecture

## Decision

Use an npm-workspaces TypeScript monorepo with separate web, HTTP API, and worker applications. Next.js supplies React routing/rendering; Fastify supplies the explicit backend boundary. PostgreSQL is the future canonical data store, accessed through Drizzle. The API initializes a database connection when DATABASE_URL is configured.

## Dependency direction

```text
web -> contracts
api / worker / MCP -> services -> domain + db + integrations
contracts -> Zod
```

The services package implements transactional workspace reads and writes. Integrations and MCP are future packages. API exposes `/health`, `/workspace`, and `/workspace/mutations`. Worker presently exits without doing work. No queue implementation is installed yet.

## Planned persistence

Candidate evidence and résumé versions are independent of versioned search profiles. Companies and jobs are shared records; evaluations and company preferences are profile-specific. Posting revisions, evaluations, applications, and outreach history retain provenance. Opportunity status, profile disposition, application stage, and outreach state remain independent.

Unknown, not evaluated, and not applicable are distinct values. No aggregate match score replaces target alignment, professional fit, or readiness. Company preference never overrides role fit. A failed source refresh does not establish that postings have closed.

## AI constraint

No paid AI provider or automatic paid fallback. Core tracking and discovery do not depend on AI. Assisted analysis is planned through ChatGPT/Codex and MCP, subject to subscription availability and limits. Direct sign-in is an optional future capability to verify, not a dependency of this shell.

## Recruiter workflow

Contacts and recruiting evidence can exist independently of jobs. Job-contact association strength must be explicit. Outreach campaigns retain drafts, delivery records, and follow-ups independently of applications. A draft is never a sent message.

## Development security

API binds to loopback by default and allows only the configured web origin. No authentication has been implemented. This is a local development shell; authentication must be added before remote exposure. Server credentials may never be shipped through public web configuration.

## Next step

Implement versioned profiles and evidence contracts, reviewed persistence schema/migrations, and application/activity invariants before connecting live sources or semantic analysis.

## Persistence increment

Migration 0001 introduces workspace revision, search profiles, immutable profile versions, opportunity drafts, profile-scoped company preferences, and append-only workspace activities. Draft job assessments are user-supplied; this is not yet automated classification or the final Opportunity/Application domain. The mutation endpoint validates Zod contracts and serializes writes using a locked revision row. Stale updates return 409; invalid batches roll back together. Workspace reads use a repeatable-read transaction.

Profile edits preserve previous definitions and increment version. Existing draft assessments are manual and do not claim automatic re-evaluation when profile criteria change. Local browser view preferences (selected profile and sort) remain local, while business data lives in PostgreSQL. Previous browser drafts remain available for explicit import; an import does not overwrite existing records or delete browser data.

No authentication is implemented yet. Bind locally only; cross-origin mutation requests are rejected, but origin checking is not a substitute for authentication before hosting.
