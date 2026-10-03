# Local release verification — 4 October 2026

The implemented local release covers all eight pieces in completion-plan.md. This is a local personal application, not a published multi-user service. Real personal records are excluded from Git.

## Implemented and checked

| Piece | Verification |
| --- | --- |
| Scheduled scans and inbox | PostgreSQL lease contention, expired/retry behavior, failure retention, due-only scans, idempotent new/changed observations and profile filtering; live worker |
| Source coverage | Live API and company identity checks for 16 boards; Greenhouse, Lever and Ashby normalization fixtures; publication vs update timestamps preserved |
| Flexible profiles | Staff and SAP retrieval fixtures, versioned edits, independent company preferences; clear roles retain target-company ordering inside review queues |
| Analysis | Exact posting quote and evidence checks, pending vs accepted state, stale version rejection, profile-change invalidation; scoped MCP tools tested in memory and over stdio; browser prepared packet and malformed JSON rejection |
| Recruiter hunt | Sourced independent contacts, profile deduplication, optional job links, drafts and manual sent/replied states; invalid sent dates and delivered-message corrections rejected; browser forms and public search links |
| Alerts and Today | New candidate/version notices, latest scan failure, pending analysis and due follow-ups; exact-version acknowledgment fixtures and PostgreSQL persistence; production Today populated from actual records |
| Operations | Foreign host/origin read/write rejection, loopback binding, local production startup; custom backup restored into a separate database and validated before disposable DB cleanup |
| Target results | Four actual Staff Frontend/UI postings saved and reviewed against local résumé evidence; source provenance and unknowns visible in UI |

Final checks: 26 regular tests passed; the database test skipped in that command was run separately and passed. Type checking and production build passed. All app routes build without placeholder-route conflicts. The MCP server exposed only four intended tools and excluded the original résumé. A restore check recovered one résumé, eight reviewed evidence claims, 16 boards, 4,272 source observations and nine migrations. A later private backup retains the finished target workspace as well.

## Target results

Confirmed search: Staff Frontend in Bengaluru / India Remote. An initial broad scan yielded 42 retrieval candidates; obvious backend/sales title exclusions reduced the inbox to 28. These are candidates, not verified matches. Four postings were read and saved as direct role targets. Fit proposals are partial, with explicit gaps and unknowns; they require acceptance in Analysis review. Eligibility, compensation and interview readiness are not invented.

| Company | Role | Location / material point | Official source |
| --- | --- | --- | --- |
| Sarvam AI | Staff Software Engineer – Frontend | Bengaluru; streaming/media depth needs verification | [Posting](https://jobs.ashbyhq.com/sarvam/b60ac66f-a2d7-4354-b67a-aa0de5ad7e3e) |
| GitLab | Staff Frontend Engineer | Bangalore listing; remote, subject to country hiring conditions; multi-team platform scope | [Posting](https://job-boards.greenhouse.io/gitlab/jobs/8826965002) |
| Okta | Staff UI Software Engineer | Bengaluru, hybrid; calibrate broader Staff ownership | [Posting](https://www.okta.com/company/careers/opportunity/7902410?gh_jid=7902410) |
| FurtherAI | Staff Software Engineer, Frontend | Explicit India remote; roughly 9 PM–2 AM IST overlap | [Posting](https://jobs.ashbyhq.com/FurtherAI/ca17de3e-f9a6-46a4-9b2b-c39c69de4ce8) |

These source observations were fetched on 3 October 2026 UTC (late evening India time). Availability can change; open the source before applying. Nothing was submitted and no messages were sent.

## Boundaries and remaining setup

The large company universe is retained, but automatic source coverage currently reaches 16 verified boards. Missing adapters require later expansion or manual discovery. Outside-universe companies can be added; there is no whitelist restriction. Company tiers remain user-curated and unclassified until chosen.

Recruiter discovery is public-search-assisted manual recording. There is no automatic LinkedIn scraping, guessed recruiter contact detail, paid enrichment or message sending. No contacts have been fabricated for this release.

No AI provider billing dependency exists. Copy/import review packets are usable now. Local MCP is implemented and verified, but the user's global client configuration was not modified. The installed Codex CLI launcher has a missing packaged binary, so registration through that launcher remains unverified. See operations.md for connection configuration. Remote hosting, authenticated multi-user access and external notification delivery are outside this local release.

## Expanded release — 4 October 2026

User requests recruiter lists only; outreach creation controls removed and no sending feature added. Local workspace now has 19 configured company boards and four remote feeds, five saved target opportunities and three source-backed public hiring contacts. Recruiter leads disclose historical/cached sources and unknown current hiring/title; none is assigned ownership of a saved job. Private contacts and résumé content remain out of Git.

Live expanded sources: Adobe frontend query (21 full descriptions), Oracle (399 listing summaries), Remote OK (99), Remotive (16), Arbeitnow (325 newest-feed records), We Work Remotely RSS (88 deduplicated records), Acceldata Lever (38 board postings). Counts are observed snapshots, not promises of current inventory or fit. Rate limits and long RSS country lists were handled without partial success; source attribution/backlinks preserved. Workable is fixture-tested only, with no populated target board configured.

New saved target: [Acceldata Staff Frontend Engineer](https://jobs.lever.co/acceldata/040901c5-dbe2-4858-a893-b10b394ea2ae), Bengaluru/on-site. Its description uses Principal scope language, so fit/level/eligibility require review. The previous four roles retain their pending analysis proposals; no assessments were accepted on the user's behalf.

39 regular tests passed and the isolated database test passed separately. Production build and all workspace type checks passed. Added verification covers complete Workday pagination/full descriptions, pinned enterprise tokens, RSS XML safety/deduplication, remote employer attribution, validated major-provider URL intake, résumé term evidence and source-grounded drafts, India digest periods/target ordering, presence disappearance/reappearance, and durable outbox deduplication with email delivery disabled. Seven MCP tools verified over real SDK stdio against five opportunities and eight reviewed evidence claims, excluding original résumé content.

Browser checks: Connections coverage/status; résumé diagnostics and GitLab comparison (8 of 13 exact terms, five supported excerpts selected into an editable draft); recruiter list/filtering with no outreach controls; discovery and opportunities after startup-service restart. No tailored résumé was saved without the user's review.

Local MCP registered in Codex config with existing settings preserved and a backup. Active client tool discovery requires reload and remains unverified in this turn. `com.varun.jobradar` launchd service installed, loaded and verified serving the local production app/API/worker; database startup no longer depends on an interactive-shell-only rg binary. Scans pause while the laptop sleeps or is off. A private backup retains the expanded workspace and migrations.

Outstanding access-dependent work: automatic LinkedIn/Indeed/Naukri/Glassdoor/Wellfound discovery has no usable authenticated connector here; search/import remains assisted. The full target-company universe is not monitored. No external search MCP or paid aggregator was installed. SMTP alerts/digests have a tested queue and TLS transport implementation, but await recipient/account settings and a real delivery test. Oracle summaries require full-posting inspection, and résumé diagnostics do not promise employer ATS compatibility or OCR.
