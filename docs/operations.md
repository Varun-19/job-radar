# Local release operations

## Run

Use the root `.env` with DATABASE_URL. Run `npm ci`, `npm run db:migrate`, `npm run build`, then `npm start`. In another terminal run `npm run dev:worker`. Use `npm run dev` during development. The local PostgreSQL instance uses port 55432 and ignored `.local/postgres`; never delete `.local` as a cache cleanup.

API and web bind to loopback. The API refuses non-loopback API_HOST and rejects foreign Host and Origin headers on reads and writes. This is a single-user local boundary, not authentication for other users on the same machine. Public or shared hosting is not configured and requires authenticated sessions, TLS, appropriate database credentials and an approved hosting destination. The root `.env.example` documents the local deployment configuration.

Daily scans are enabled in the current personal workspace for 16 boards. They run while the worker is active. Source presence is a timestamped observation, not a guarantee of continued availability. Failed or missing scans do not close jobs or remove history. Source coverage is shown in Company universe; companies without an adapter remain in the preference universe and can be investigated manually. Outside-universe companies may be added through a board configuration or manual posting. No paid search or AI dependency is required.

## Private backup and restore

`npm run db:backup` writes a custom PostgreSQL dump under ignored `.local/backups` with mode 600. These files contain private résumé and outreach data. They are not encrypted; store an encrypted copy separately if needed. PostgreSQL client binaries must be compatible with the server.

Restore without overwriting the active database:

```sh
npm run db:restore -- .local/backups/<backup>.dump jobradar_restore_my_copy
```

The command only creates a new database whose name begins `jobradar_restore_`. Existing names fail. A failed restore leaves the separate database for inspection. Point DATABASE_URL at the restored database only after verifying it. Restore was exercised successfully against the current local data; counts and migrations were checked before removing the disposable verification database.

## Review without an AI API bill

Analysis review exports a packet containing the selected posting, its versioned search profile and reviewed professional claims. It excludes original résumé bytes, raw résumé text and recruiter contact records. You can copy the JSON into your existing ChatGPT conversation and ask it to return the supplied response template. Import the proposal in JobRadar. Exact source quotes, evidence IDs and posting/profile versions are checked. Unsupported eligibility and readiness must remain unknown. Pending proposals do not change accepted fit. The user accepts or rejects in the UI. Editing a search profile or changing posting content resets canonical assessments; stale proposals cannot be accepted. Source text is untrusted data, not instructions.

The local MCP server is also implemented and tested over stdio. In a compatible MCP client, use an absolute Node executable, this project's `apps/api` directory as cwd, and arguments:

```text
--env-file-if-exists=../../.env --import tsx src/mcp.ts
```

Example Codex configuration (replace both absolute paths for your installation):

```toml
[mcp_servers.jobradar]
command = "/absolute/path/to/node"
args = ["--env-file-if-exists=../../.env", "--import", "tsx", "src/mcp.ts"]
cwd = "/absolute/path/to/job-radar/apps/api"
```

Available tools: `list_profiles`, `list_opportunities(profileId)`, `get_review_packet(jobId)`, `propose_evaluation(expectedRevision, evaluation)`. There are no accept, send, apply or arbitrary mutation tools. Connect it only to the client you want to use. The user's global Codex configuration has not been modified. The currently installed CLI launcher could not locate its packaged binary, so registration through that launcher was not verified; the server itself passed the SDK stdio connection check. Copy/import works independently of registration.

OpenAI documents shared CLI/IDE MCP configuration in its [Docs MCP guide](https://developers.openai.com/learn/docs-mcp). This local server does not call an OpenAI API or consume API credits. Your ChatGPT/Codex client's own plan and usage limits still apply.

## Recruiter hunt

Use public profile and hiring-post searches, then record a source URL, exact recruiting quote and observed date. This is assisted manual discovery, not authenticated LinkedIn scraping or automatic enrichment. Specific job ownership must be supported before associating a vacancy. No recruiter details are guessed from an employer match. Independent outreach needs no job. Copy drafts and send manually; record the actual sent time before moving to sent/replied. Corrections to delivered records require a note. Today displays due outreach and application follow-ups using India dates. Acknowledgments hide one exact alert version and retain the underlying record.

## Release verification

Run `npm run typecheck`, `npm test`, `npm run test:db`, `npm run build`. DB tests create and remove a separate test database. Browser checks cover opportunity filtering, independent recruiter forms, prepared review packets, analysis proposals, company coverage, Today actions and discovery schedules. See release-verification.md for the observed release status and its limits.
