# Source and Opportunities audit — 6 October 2026

The Opportunities list is a collection of review leads, not a count of confirmed openings matching every preference. Employer/source inventory, profile retrieval, role assessment, country eligibility and company preference are separate stages.

## Corrections

- Desktop results and job details have independent, keyboard-accessible scrolling, bounded by the visible viewport. Selecting a different job resets the detail scroll. Narrow layouts retain the list/detail navigation and normal page scrolling.
- Compact profile/search controls and mobile navigation leave more space for jobs. The mobile scrollbar has its own space below the navigation links so it cannot cover their click areas. The header’s Find more jobs action opens the search/import controls directly. The company-scope filter can show companies outside the historical universe. “Out of scope” refers to role/eligibility/exclusion criteria, not unfamiliar employers.
- Within a company preference and assessment, requested locations and explicit role/level titles precede broad description matches. This is retrieval ordering; it does not assert professional fit or employment eligibility.
- Retrieval terms use word boundaries and frontend separator aliases. `intern` no longer excludes `Internal`, and `React` no longer matches `Reacting`. The short term `UI` must occur in the title; a generic UI mention in a description is insufficient.
- Automatically collected, unassessed leads that no longer match current discovery criteria appear in Out of scope. Their saved assessments and history remain intact. Reviewed decisions and explicit external imports are retained. Today, Opportunities and MCP use the same rule.
- Saved postings refresh when their title/location changes out of the retrieval criteria. Previously that filter ran before the refresh, leaving the saved posting stale.
- Workday uses real primary and additional locations rather than a listing label such as “2 Locations.”
- Oracle follows reported totals and offsets even when a nonfinal page contains fewer rows than its page limit. The observed bug reported 199 rows as a completed scan despite a total of 2,235. It now fetches full external descriptions, responsibilities, qualifications and secondary locations. A detail or pagination failure fails the scan and retains prior observations.
- The shipped Oracle source uses the visible `frontend` keyword scope to bound per-posting detail requests. This is not Oracle's complete career inventory. Other keyword variants or a wider source configuration are needed for broader coverage.
- Scan history retains the latest outcome for every configured board, even when that outcome falls outside the latest 100 overall runs.
- Cards show actual last-seen dates where radar observations exist. A posting absent from a later company-board snapshot receives a warning; absence does not establish that the opening is closed. Remote feed records accumulate and may age out of the feed window without a closure signal.
- MCP job lists now include pagination, source URLs, descriptions, eligibility, company preference and the current queue. A coverage tool reports actual sources and gaps. Research queries include all configured terms and quote phrases. Imports and automatic intake share URL normalization; changed external imports refresh their existing source record.

- Pending analyses are marked for refresh when either the profile or posting version has changed. Historical reasoning remains visible, but accepting a stale proposal is disabled; the server already enforces the same rule.

## Actual source coverage

The verified configuration has **52 company sources and 4 remote feeds**. It maps sources for **50 of 120 historical-universe companies**; OpenFX and Arctic Wolf are additional employers outside that universe. Keyword-filtered sources are explicitly labelled in Sources & scans.

| Source type | Implemented collection |
| --- | --- |
| Greenhouse, Ashby, Lever | Public employer-board inventory and descriptions |
| Workday, SmartRecruiters | Paginated keyword-scoped inventory and per-posting details |
| Oracle | Paginated inventory and per-posting details; shipped keyword scope is `frontend` |
| Rippling | Paginated board and verified per-posting employer/details |
| Remote OK, Remotive, Arbeitnow, We Work Remotely | Public feed/API windows, with source attribution and region text |
| LinkedIn, Indeed, Naukri, Glassdoor, Wellfound | Assisted public search/preview/import; no automatic authenticated provider collection |
| Other employer career sites | Client research and sourced imports; no universal career-page crawler |

Lever EU and Workable adapters are supported but are not configured in this instance. A provider adapter, a configured employer source, a successful scan and full market coverage are different claims.

Missing mapped employers include Google, LinkedIn, Microsoft, Atlassian, Walmart Global Tech, Intuit, Nutanix, SAP and many others. Sources & scans lists all unmapped companies, latest run outcomes, source keywords and short-description counts. Source totals describe retained observations; feed totals do not prove that every retained vacancy remains open.

## Why LinkedIn shows more results

The app does not collect LinkedIn's whole search inventory. Its worker searches configured employer boards and feed windows. Unsupported/unmapped employers, keyword-scoped boards, strict title levels and literal location fields can all reduce recall. Major-provider search pages also contain broader levels, repeated postings and roles outside the selected country/role scope.

One verified missed case was [OpenFX's Bengaluru Senior Frontend Engineer (L5) — Banking posting](https://job-boards.greenhouse.io/openfx/jobs/5373810008). Its description explicitly describes a Staff frontend role despite its Senior title. The employer board was added and the exact vacancy was imported through MCP into Needs review, preserving the title/body discrepancy. This does not broaden the profile to all Senior jobs.

Country eligibility remains unverified. `Remote` can mean US-only or another country restriction; it must not be interpreted as India Remote. Existing broad leads and old captures remain available for review rather than being deleted to inflate apparent precision.

## MCP verification and limits

The actual stdio server was exercised through the local SDK client, including source coverage, paginated job listing and a source-backed import. An unchanged reimport should be a no-op; source changes invalidate previous assessments through the normal refresh/history path. Unit and database integration tests cover deduplication, refreshes, presence and coverage.

`get_research_plan` prepares queries. A client with browsing capabilities must execute the searches and import verified results. MCP registration alone does not prove that the desktop chat has loaded the server or that unattended research is running. No recruiter messages or applications are sent by these tools. Recruiter contacts remain sourced, separately collected records; an employer match does not establish vacancy ownership or active recruiting.

## Verification

- 70 unit tests passed; the opt-in database test was run separately and passed against an isolated PostgreSQL database. Production build and all workspace type checks passed.
- Browser checks covered 13 widths from 320 to 1440 px and viewport heights of 600, 720, 844 and 900 px. No document horizontal overflow was found. Desktop panes remained within the viewport; their lower content was reachable with wheel and keyboard scrolling. Selecting another job reset detail scrolling. Mobile Back restored the selected card’s focus.
- The outside-universe filter surfaced OpenFX, Arctic Wolf and Sparix Global in Needs review. The header action opened the provider search/import controls. Stale assessment acceptance was disabled in the live UI.
- Real MCP coverage and paginated listing calls succeeded. The latest scan outcome for all 56 configured sources was successful at the final checkpoint. A Rippling timeout was displayed accurately; a single retry succeeded with 339 postings, while saved jobs remained intact.
- The selected profile has 102 retained jobs: 74 Needs review and 28 Out of scope. There are no confirmed Relevant assessments. These are review leads, not 102 confirmed Staff Frontend openings. Clear Bengaluru title matches include Palo Alto Networks, GitLab, Okta, Acceldata, Sarvam AI and Zscaler; full-stack and adjacent-level leads still require scope review.

Local evidence and screenshots are retained under ignored `.local/`. Résumé data, credentials and personal contact details are excluded from this report and from Git.
