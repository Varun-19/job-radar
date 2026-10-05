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

## Follow-up review — 4 October 2026

Reviewed the worker, source inventory reads, digest filtering, notification queue, and MCP boundaries. Fixed two notification correctness issues: digests previously inherited the UI's 1,000-posting cap before profile filtering, and pending digest bodies could freeze before later scans finished. Notification input now includes the full inventory; queued bodies refresh only while pending. Sending and sent records remain unchanged.

The isolated PostgreSQL regression includes 1,001 newer unrelated postings hiding a relevant role from the UI-sized inventory, verifies that the digest still includes that role, and checks pending refresh plus sent-body immutability. SMTP delivery still requires configuration and live verification; this regression does not claim email delivery was tested.

## Remaining-scope release — 4 October 2026

- 40 configured company boards and four remote feeds. Added 21 live-verified company sources through migrations 0014–0016. SmartRecruiters ServiceNow/Canva and Workday Adobe scans are query-limited to frontend. Full historical-universe automatic coverage remains incomplete. Source response cap is 24 MB; location lists retain up to 5,000 characters.
- Seven saved target opportunities: Sarvam AI, GitLab, Okta, FurtherAI, Acceldata, Zscaler (Browser Extension/React), and Noon (hands-on Staff Frontend). The latter three have pending evidence-grounded partial-fit proposals; accepted fit, eligibility and readiness remain unchanged.
- Five sourced hiring contacts. New Deepanshi Verma and Ashwin narayan leads preserve exact public quotes, historical/source-age caveats and unverified current status. No messages sent.
- Public provider URL preview has pinned hosts, no redirects, no authentication bypass and reviewed import. Fixture extraction tests pass. Live Indeed access returned HTTP 401; browser verification showed the failure and seven saved jobs remained unchanged. This is not automatic provider search.
- PDF diagnostics verified against both supplied pages: text is extractable, dimensions are 458 × 649 points. Both pages were visually inspected; education and role/date clarity need review. Original bytes were preserved. Private review notes remain ignored. No employer-specific ATS compatibility score is claimed.
- Nine MCP tools verified using the SDK stdio client with seven opportunities and eight reviewed claims. Research plan covers the complete company universe. Active-client loading still requires reload.
- SMTP connection/authentication test sends no mail. Controlled failed-message retry requires explicit non-delivery confirmation. Missing credentials were verified in the UI; live delivery remains untested.
- Historical company aliases preserve company coverage and tier preferences. Explicit per-name tiers take precedence when existing aliases conflict.
- Production build, all workspace type checks, 44 regular tests plus one isolated DB test passed. One DB test is intentionally skipped in the regular suite and run separately.
- Expanded backup was restored into a disposable database: 16 migrations, seven jobs, five contacts and eight professional evidence records matched the original. Only the disposable verification database was removed.

Outstanding: authenticated/background discovery for major providers, additional company-source resolution, continuous recruiter research beyond the assisted workflow, SMTP recipient/account configuration and real delivery verification, and active-chat MCP reload. Plugin discovery did not return a ready-to-use job-search connector for the requested providers.

## 5 October continuation verification

- Verified Palo Alto Networks' official Apply link maps to Workday `paloaltonetworks/wd5/panwexternalcareers`; fetched 39 frontend-query full descriptions, enabled a daily schedule, and saved its Bengaluru Staff Frontend role with a pending résumé-based proposal.
- Verified Tekion's current official careers script uses Ashby `tekion`, following historical Greenhouse HTTP 404. Fetched 102 postings, enabled daily scans, and left the adjacent frontend Architect role in discovery.
- Added one sourced public recruiter lead from a separate Palo Alto contract job listing. Current hiring and ownership of the frontend role remain unverified; no messages sent.
- Implemented and boundary-tested recruiter recheck reminders (unverified or evidence observed at least seven days ago), available in the UI and MCP research plan. No automated external recruiter search is claimed.
- Passed 45 regression tests, one isolated PostgreSQL integration test with all 18 migrations, workspace type checks and production build. Live stdio MCP verified nine tools, eight target opportunities, eight reviewed claims and six public contact recheck entries.
- Running browser verified 42 company boards, four feeds, eight saved roles, six contacts, the recruiter filter and the pending Palo Alto fit proposal. Active-chat MCP tools still unavailable, SMTP configuration still absent, and remaining full-universe and protected-provider discovery remain unfinished.

## Expanded source/query verification — 5 October 2026

- Added nine live-verified sources: NVIDIA, Salesforce, Mastercard, Workday, Procore, Cisco, Arctic Wolf, Mistral AI and Rippling. Seven Workday sources cover the disclosed frontend query (130 postings combined). Mistral snapshot: 209; Rippling snapshot: 331 distinct public postings from complete pagination and full-detail retrieval.
- Rippling fixtures verify repeated list records, complete multi-page reads, ignored page parameters, partial inventories, unlisted records, mismatched employers and unsafe posting URLs. Contract fixtures verify dotted Ashby handles, traversal rejection, distinct supported queries and rejection of ignored query fields.
- Regression suite passed (51 tests, one database-only skip); the added pagination case and six related focused cases also passed. All workspace type checks and production build passed. Isolated PostgreSQL integration verified all 20 migrations. Local stdio MCP returned nine scoped tools, nine saved roles, eight reviewed claims and six recruiter recheck entries.
- Browser checks: duplicate board/query error and unsupported provider-query error caused no coverage mutation; Connections displays 51 company boards/four feeds; All jobs displays nine saved roles. Selected Procore role visibly preserves the title/description scope mismatch and pending partial-fit proposal.
- Backup restore compared all 20 migration records, nine jobs, six contacts and eight evidence records against the original in an isolated temporary database. Original workspace preserved.
- Remaining full company-universe coverage, protected-provider automatic discovery, continuous recruiter discovery, active-chat MCP tool loading and configured SMTP delivery remain unfinished. No cold messages, external résumé uploads or job applications were sent.
