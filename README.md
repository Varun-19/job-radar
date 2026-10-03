# job-radar

First slice: executable UI and backend shells, worker entry point, and shared package boundaries. No live job feeds, database persistence, outreach delivery, or AI calls yet. The opportunity workbench supports browser-local drafts and company preferences; these are not canonical database records.

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

## Optional database shell

```sh
npm run db:up
npm run db:down
```

Docker is required for these commands. The application does not connect to PostgreSQL in this slice. The volume persists after `db:down`. Compose credentials are for local development only.

## Configuration

API defaults: `API_HOST=127.0.0.1`, `API_PORT=4000`, `WEB_ORIGIN=http://localhost:3000`.
Web client default: `NEXT_PUBLIC_API_URL=http://localhost:4000`.
The root `.env.example` documents future database configuration. Environment files are not automatically loaded by the API shell; provide overrides in your shell. Next.js accepts `apps/web/.env.local`.
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
  services/             Planned: use cases shared by API, worker, and MCP
  integrations/         Planned: job sources and readiness/delivery adapters
apps/mcp/               Planned: thin tool interface over services
tests/                  API contract smoke tests
```

`services`, `integrations`, and `mcp` are architectural reservations, not implemented packages.

## Boundaries

- Browser code may import contracts and browser-safe domain types.
- Browser code must not import database, services, credentials, or integrations.
- Next.js server components render the interface; business state changes belong to API services.
- API, worker, and future MCP handlers share application services rather than making independent business decisions.
- Domain code stays independent of React, HTTP, SQL, and AI providers.
- Database code is internal to the server. Use contracts as the public API, not database rows.

See [architecture](docs/architecture.md) and [first-slice scope](docs/first-slice.md).
