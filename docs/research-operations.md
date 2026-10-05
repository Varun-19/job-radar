# Recurring research operations

The public source worker scans configured boards and feeds. Client-assisted public web research supplements those scans; it is not an authenticated LinkedIn, Indeed, Naukri, Glassdoor or Wellfound connection. A scheduled chat can perform this research using available web tools without a paid API adapter. The computer and desktop app must be available for local imports. Scheduled runs consume the account's normal usage allowance.

## Local MCP fallback

If the active chat has not loaded JobRadar tools, use the tested stdio client:

```sh
node --import tsx scripts/research.mts get_research_plan .local/plan-arguments.json > .local/research-plan.json
```

The arguments file contains `{"profileId":"staff-frontend-india"}`. The plan includes the current revision, full company universe, configured boards, provider queries and contacts needing recheck. The client does not search by itself. It accepts these tool names: get_research_plan, list_profiles, list_opportunities, list_discovery_candidates, preview_public_job_url, import_external_jobs and save_recruiter_contacts. Each takes a local JSON arguments file using the same input schema as the MCP tool. Research text and personal information belong in ignored `.local/`, never Git.

For `import_external_jobs`, supply `expectedRevision`, `profileId` and `postings`. Each posting requires provider, company, title, location, exact description and HTTPS URL. Prefer canonical employer pages. Imports enter Needs review with unknown fit and eligibility. URLs are normalized and duplicate URLs are skipped. Different URLs for one vacancy need manual duplicate review. Refetch the plan after a conflict; do not blindly replay stale mutations.

For `save_recruiter_contacts`, supply `expectedRevision` and `contacts`. Each contact requires id, name, company, title, profileUrl, sourceUrl, exact sourceQuote, observedAt (ISO date), recruitingStatus, notes and jobIds. Preserve existing IDs when updating. New contacts and updates remain unverified. Do not associate a recruiter with a vacancy without direct evidence. An inaccessible page or cached search snippet is a research lead, not confirmation of current hiring. Do not advance observedAt merely because a snippet was found again.

## Daily workflow

1. Read the current profile, jobs, discovery candidates and research plan. Respect the profile's current location and role criteria, company preferences and exclusions.
2. Search public major-provider pages and official careers pages. Rotate through ten companies lacking adapters per run, recording the cursor and source-resolution notes in `.local/research/`. Search outside the historical universe too.
3. Open each potentially relevant posting. Reject expired redirects, broad search pages and unrelated roles. Preserve full source text locally and import source-backed vacancies into Needs review; do not invent role fit, India eligibility or interview readiness.
4. Recheck stale hiring contacts and search public hiring posts. Preserve source uncertainty, employer/title ambiguity and post age. Save sourced contacts only. Never send cold messages or applications.
5. Keep a dated local run report with queries, URLs, access failures, imported IDs, duplicate decisions and unresolved boards. Only report meaningful additions, changed hiring evidence, failures or required user action.

Scheduled research is configured in the desktop app, separately from JobRadar's board worker. Registration of a schedule proves only that it is saved; subsequent unattended runs and successful imports must be verified from their reports.

## Email handoff

The recipient and Gmail SMTP defaults are configured only in the ignored local `.env`. Add the account's Gmail app password to `SMTP_PASSWORD` locally; never paste it into chat. Restart the local service and use Connections → Test SMTP connection. This verifies authentication without sending email. Delivery is not proven until a digest has a sent record and the recipient confirms receipt. Gmail configuration with missing authentication is shown as incomplete and does not claim pending messages.
