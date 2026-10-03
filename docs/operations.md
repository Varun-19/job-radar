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

## Expanded discovery and operations

`npm run install:autostart` registers `com.varun.jobradar` in the current user's LaunchAgents. The running service starts local PostgreSQL, production web, API and worker. Build first. Logs are ignored under `.local/logs`. `launchctl bootout gui/$(id -u)/com.varun.jobradar` unloads it for the session; its plist remains for next login. Reinstall if the checkout or Node path changes. A login service cannot scan while the laptop is asleep/off. Do not run another copy on ports 3000/4000.

`npm run mcp:register` preserves existing Codex settings and backs them up before adding JobRadar. Reload the client; configuration registration is distinct from active tool discovery. Seven tools: the original four plus `list_discovery_candidates`, `import_external_jobs`, `save_recruiter_contacts`. Client-supplied source text is untrusted. Imports remain Needs review; contacts are saved as unverified. There are no sending/application/acceptance tools.

Company adapters now include Workday, Oracle Recruiting Cloud and Workable. Workday optionally accepts a `searchText` query; configured Adobe coverage is limited to frontend, with full descriptions. Oracle currently supplies listing summaries; inspect the original vacancy for full scope before analysis. Workable has fixture coverage but no populated target board is configured. Maximum 5,000 postings, bounded body sizes, pinned provider hosts, no redirects, complete enterprise pagination, leased scan heartbeat and bounded description requests. Public endpoints can change or rate-limit; failures preserve old records.

Four feed adapters: Remote OK, Remotive, Arbeitnow and We Work Remotely RSS. Preserve source attribution and backlinks. Remotive is delayed by 24 hours and schedules must be at least six hours apart. Feed windows are not complete inventories; missing feed items never create closure observations. Company-board absences are counted only after successful scans, displayed as unconfirmed, and reset on reappearance. No absence automatically removes an application or saved job.

LinkedIn, Indeed, Naukri, Glassdoor and Wellfound are assisted search/import paths, not authenticated background integrations. We Work Remotely additionally has its public feed. Their source URLs are validated and tracking parameters stripped for import identity. Different URLs across providers require manual duplicate review; job ownership is not inferred. See [LinkedIn API access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access) and [Indeed API catalog](https://docs.indeed.com/api-guides/) for access boundaries. No paid aggregator/search/model service was added.

Résumé review checks extracted text, encoding, headings, contact presence and measurable outcomes; requirement matches expose exact excerpts. These are diagnostics, not employer ATS scores. Missing terms do not prove missing skills. Tailored text drafts select exact evidence from the chosen résumé, preserve original text and require user editing/review before saving a separate version. No OCR, layout compatibility guarantee or automatic application submission.

Email delivery uses optional local SMTP settings in `.env.example`. Daily candidate digests queue after 09:00 IST; weekly digests Mondays after 09:00 IST. Empty digests are skipped. Outbox records are unique per profile/kind/period; private prepared copies are under `.local/mail-outbox`. Configure sender, recipient and TLS SMTP account locally. No email is sent without configuration. Failed/interrupted sends require manual provider-delivery review before retry to avoid duplicates. SMTP delivery has not been tested with a real account. Connections shows metadata and delivery status without credentials.
