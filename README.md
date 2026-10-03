# job-radar

The UI, API, and shared services support PostgreSQL-backed job drafts, company preferences, versioned search profiles, immutable résumé versions, reviewed professional evidence, and manual application tracking. Today shows saved records and due follow-ups. On-demand discovery from configurable Greenhouse and Lever company boards is available. Scheduled discovery, recruiter workflows, outreach delivery, and AI analysis remain pending.

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

The worker currently prints its unconfigured status and exits. It does not consume a queue yet.

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
    src/index.ts        Background worker shell
packages/
  contracts/src/        Shared Zod request/response schemas
  domain/src/           Pure business types and rules
  db/src/               Server-only PostgreSQL/Drizzle access
  services/             Shared workspace use cases and transactions
  integrations/         Planned: job sources and readiness/delivery adapters
apps/mcp/               Planned: thin tool interface over services
tests/                  Domain, API, extraction, and persistence tests
```

`integrations` and `mcp` are architectural reservations, not implemented packages.

## Boundaries

- Browser code may import contracts and browser-safe domain types.
- Browser code must not import database, services, credentials, or integrations.
- Next.js server components render the interface; business state changes belong to API services.
- API, worker, and future MCP handlers share application services rather than making independent business decisions.
- Domain code stays independent of React, HTTP, SQL, and AI providers.
- Database code is internal to the server. Use contracts as the public API, not database rows.

See [architecture](docs/architecture.md) and [first-slice scope](docs/first-slice.md).

## Résumés and applications

At `/evidence`, upload a readable PDF, TXT, or Markdown résumé (up to 4 MB), or paste text. Processing runs on the local API without an AI provider. The original bytes and extracted text are retained in immutable versions; reuse a series label to add a version. Scanned PDFs require text pasted separately or external OCR. Résumé evidence must cite a quote found in its selected version. Project and manual evidence can be recorded separately.

At `/applications`, track a saved opportunity, stage, exact résumé version, actual submission date when known, follow-up date, and notes. Unknown dates remain unknown. Reopening, moving backwards, or correcting a résumé/submission date after preparation requires an explanation. Updates append activity history and do not send applications or messages. Today surfaces due follow-ups using India time.

Run `npm run db:migrate` for the additive tracking migration before using these screens. Résumé interpretation and evidence-based job suggestions are not implemented yet.

## Live discovery

In `/opportunities`, choose **Discover live jobs**. A verified Datadog Greenhouse board is seeded; add other company tokens from their public Greenhouse or Lever board URLs (including Lever EU). Boards persist in PostgreSQL. Fetching is read-only and never imports automatically. Filter titles and locations with comma-separated terms, then save selected postings into the active profile’s Needs review queue. The same process supports Staff, SAP, or other role searches.

Provider, board token, posting ID, retrieval time, and available source update time persist with each imported posting. Imports keep fit and eligibility unknown. Duplicate source postings are rejected within the same profile, while different profiles can review them independently. Use **Save assessment** in the job detail to record your review; company tiers keep relevant target companies first. The imported timestamp is not a publication date.

This increment covers manually initiated board snapshots, with 20-second requests, fixed provider hosts, no redirects, and bounded response sizes. It does not cover the entire company universe, arbitrary career websites, LinkedIn, scheduled scans, posting revision refresh, or closure inference. A failed fetch leaves existing jobs unchanged.

Adapter references: [Greenhouse Job Board API](https://docs.greenhouse.io/job-board.html), [Lever Postings API](https://github.com/lever/postings-api).
