# job-radar

JobRadar is a local personal job and recruiter workspace. It supports flexible profiles, company preferences, scheduled company-board and remote-feed discovery, immutable posting and résumé history, reviewed professional evidence, analysis proposals, manual applications, independent recruiter outreach drafts, follow-ups and in-app alerts. It makes no paid model calls and never sends messages or applications.

The current local workspace contains live Staff Frontend results for Bengaluru / India Remote. Personal records live in PostgreSQL and ignored `.local`, not in this repository. See [release verification](docs/release-verification.md) and [operations](docs/operations.md).

## Start

Requires Node.js 22.9+ and npm. Dependencies are locked in package-lock.json.

```sh
npm ci
npm run dev
```

Web: http://localhost:3000 • API health: http://localhost:4000/health

```sh
npm run typecheck
npm test
npm run build
npm run dev:worker
```

The worker checks enabled schedules every minute. PostgreSQL leases prevent concurrent scans of a board. It must remain running for automatic discovery; laptop sleep pauses scanning.

## Database setup

```sh
npm run db:up
npm run db:down
```

Docker is required for these commands. The volume persists after `db:down`. Compose credentials are for local development only. Copy `.env.example` to `.env`, then run `npm run db:migrate` before starting the app.

If PostgreSQL binaries are installed locally, use the isolated project instance instead:

```sh
npm run db:local
# Set DATABASE_URL in .env to postgresql://jobradar:jobradar@127.0.0.1:55432/jobradar
npm run db:migrate
npm run dev
```

This instance binds to localhost on port 55432 and stores data under ignored `.local/postgres`. Stop it with `npm run db:local:stop`. Development credentials are not appropriate for remote hosting.

The current machine has this local instance configured. Do not delete `.local` to clean build output: it contains your database.

Run `npm run test:db` to test persistence in a newly created temporary database; the test removes only that database afterward.

## Configuration

API defaults: `API_HOST=127.0.0.1`, `API_PORT=4000`, `WEB_ORIGIN=http://localhost:3000`.
Web client default: `NEXT_PUBLIC_API_URL=http://localhost:4000`.
The root `.env.example` documents database configuration. The API and migration command load root `.env`; explicit shell environment variables take precedence. Next.js accepts `apps/web/.env.local`.
Only public configuration may use `NEXT_PUBLIC_` variables. Credentials must remain server-side.

## Source layout

```text
apps/
  web/                  Next.js UI; no database imports
    app/                Layout and routes (server components by default)
    components/         Interactive UI; explicit 'use client' boundary
  api/
    src/app.ts          HTTP app factory; independently testable
    src/index.ts        API startup and shutdown
  worker/
    src/index.ts        Leased discovery scheduler
packages/
  contracts/src/        Shared Zod request/response schemas
  domain/src/           Pure business types and rules
  db/src/               Server-only PostgreSQL/Drizzle access
  services/             Shared workspace use cases and transactions
  integrations/         Company-board and remote-feed adapters
apps/api/src/mcp.ts     Local stdio MCP entry point over shared services
tests/                  Domain, API, extraction, and persistence tests
```

MCP tools expose scoped reads and pending evaluation proposals. Acceptance stays in the UI. Run `npm run mcp` from an MCP client; stdout is reserved for protocol messages.

## Boundaries

- Browser code may import contracts and browser-safe domain types.
- Browser code must not import database, services, credentials, or integrations.
- Next.js server components render the interface; business state changes belong to API services.
- API, worker, and MCP handlers share application services rather than making independent business decisions.
- Domain code stays independent of React, HTTP, SQL, and AI providers.
- Database code is internal to the server. Use contracts as the public API, not database rows.

See [architecture](docs/architecture.md) and [first-slice scope](docs/first-slice.md).

## Résumés and applications

At `/evidence`, upload a readable PDF, TXT, or Markdown résumé (up to 4 MB), or paste text. Processing runs on the local API without an AI provider. The original bytes and extracted text are retained in immutable versions; reuse a series label to add a version. Scanned PDFs require text pasted separately or external OCR. Résumé evidence must cite a quote found in its selected version. Project and manual evidence can be recorded separately.

At `/applications`, track a saved opportunity, stage, exact résumé version, actual submission date when known, follow-up date, and notes. Unknown dates remain unknown. Reopening, moving backwards, or correcting a résumé/submission date after preparation requires an explanation. Updates append activity history and do not send applications or messages. Today surfaces due follow-ups using India time.

Run `npm run db:migrate` for the additive tracking migration before using these screens. Résumé interpretation and evidence-based job suggestions are not implemented yet.

## Live discovery

In `/opportunities`, choose **Discover live jobs**. Verified Greenhouse boards for Cloudflare, Databricks, Datadog, Figma, and MongoDB are seeded; add other company tokens from their public Greenhouse or Lever board URLs (including Lever EU). Boards persist in PostgreSQL. Fetching is read-only and never imports automatically. Filter titles and locations with comma-separated terms, then save selected postings into the active profile’s Needs review queue. The same process supports Staff, SAP, or other role searches.

Provider, board token, posting ID, retrieval time, and available source update time persist with each imported posting. Imports keep fit and eligibility unknown. Duplicate source postings are rejected within the same profile, while different profiles can review them independently. Use **Save assessment** in the job detail to record your review; company tiers keep relevant target companies first. The imported timestamp is not a publication date.

The first board increment has been expanded: scheduled company scans, enterprise adapters, four remote feeds, source-presence observations and assisted major-provider imports are implemented. The entire company universe and authenticated LinkedIn/Indeed/Naukri/Glassdoor discovery are not covered. See Connections and docs/operations.md for current capabilities and limits. A failed fetch leaves existing jobs unchanged.

Adapter references: [Greenhouse Job Board API](https://docs.greenhouse.io/job-board.html), [Lever Postings API](https://github.com/lever/postings-api).

## Posting refresh and discovery review

Discovery results are paginated in groups of 25. **Select this page** selects visible postings; selections can accumulate across pages up to 100, and changing filters or profile clears them. The board dropdown orders configured boards by the selected profile’s company tiers. Fetching never imports or overwrites saved postings.

For a previously saved posting, **Update saved posting** or **Record latest check** accepts a new observation. All observations have immutable versions viewable under Posting history in the opportunity detail. Changed title, location, company label, description, or URL returns the role to Needs review with unknown fit and eligibility. Unchanged content preserves your assessment. Shortlists, application IDs, résumé selections, and submission dates are retained. New applications reference the posting version present when tracking began; older application records without that reference remain unknown.

Migration 0004 preserves an initial version of existing imported postings and adds four verified starter boards without changing company tiers or importing jobs. Scheduled scans and coverage beyond these configured providers remain pending.

The expanded local release adds recruiter-list discovery, résumé text/ATS diagnostics and evidence-grounded drafts, nine MCP tools, login startup and daily/weekly email outbox preparation. SMTP delivery needs local account configuration. Open `/connections` for honest source and delivery coverage.
