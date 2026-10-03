# Architecture

## Decision

Use an npm-workspaces TypeScript monorepo with separate web, HTTP API, and worker applications. Next.js supplies React routing/rendering; Fastify supplies the explicit backend boundary. PostgreSQL is the future canonical data store, accessed through Drizzle. The first slice does not initialize a database connection.

## Dependency direction

```text
web -> contracts
api / worker / MCP -> services -> domain + db + integrations
contracts -> Zod
```

Services, integrations, and MCP are future packages. API presently exposes only `/health`. Worker presently exits without doing work. No queue implementation is installed yet.

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
