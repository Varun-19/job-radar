# Workspace layout and page ownership

Daily navigation is Today, Opportunities, Applications and Recruiters. Analysis is a review tool. Search setup contains Sources & scans, Search profiles, Résumés & evidence, Target companies and Connections. The setup group opens on its own pages and the active link is marked.

| Page | Owns | Secondary controls |
|---|---|---|
| Today | Active-profile counts, jobs awaiting review and follow-ups | Individual notices and acknowledgments |
| Opportunities | All discovered and manually added jobs for the selected profile | Provider searches, public URL preview, JSON import and manual board fetch |
| Applications | Application stages, follow-ups, exact résumé used and history for the selected profile | Create/update forms; closed records retained |
| Recruiters | Sourced contacts across searches and hiring evidence | Search and contact entry/edit; no messages sent |
| Analysis | Evidence-backed assessment proposals | Packet export/import and historical assessments |
| Sources & scans | Company boards, remote feeds, schedules, failures and scan history | Source registration; no separate job review queue |
| Profiles | Flexible role/location/level discovery criteria | Editing and new searches |
| Résumés & evidence | Versioned original résumés, job checks and professional claims | Extracted text and tailored drafts |
| Target companies | Employer preference tiers | Search, unclassified/all views and 20-row pages |
| Connections | Source, email and assistant readiness | Diagnostics and setup details |

## Jobs arrive automatically

A successful radar scan synchronizes matching observations into Opportunities for each configured profile. Worker ticks also backfill existing observations, including after profile criteria change. Intake uses configured retrieval criteria and skips missing observations and explicitly excluded companies. It does not infer professional fit or employment eligibility.

New jobs enter Needs review with unknown fit and eligibility. The queue is the default view and is paginated at 20 rows. Relevant and Needs review are disjoint: unresolved role alignment or eligibility stays in review. Outside-target jobs remain available in their queue. Target company preferences order review candidates within these gates.

Source identity and canonical posting URL prevent duplicate intake within a profile. Repeat observations preserve assessments. Changed posting content refreshes the existing job, preserves source history and shortlist state, and resets its assessment for review. Source title/company/location whitespace is normalized before comparison so inconsequential padding cannot trigger repeated updates. Intake uses version-checked workspace mutations and retries conflicts. Opportunities and Today refresh workspace revisions every 15 seconds, skipping updates while local mutations are pending.

Opportunities shows posting source and observation date. Retrieval candidates are not confirmed openings or confirmed India-eligible Staff Frontend matches. Users review actual scope and eligibility before pursuing them. Provider imports remain explicit actions within Opportunities; automatic LinkedIn/Indeed/Naukri/Glassdoor account collection is not implied.

## Responsive and secondary workflows

Only Opportunities switches between list and selected detail below 1150px, with a Back action that restores selection focus. Applications and Evidence stack their panels. Shared grids and long text shrink/wrap to the viewport.

Evidence has résumé versions, job checks and professional evidence views. Original download stays accessible, while extracted text is collapsed. Analysis initially selects a job with a pending proposal, shows pending proposals first and collapses history and transfer machinery. Recruiter contacts use compact disclosures. Company aliases share one preference row, edits synchronize existing alias keys, and feed labels are excluded from employer rows. The full employer universe remains available.

## Verification — 5 October 2026

59 unit tests pass; the isolated PostgreSQL integration test also passes. Typecheck and production build pass. Intake tests cover profile matching, source/URL deduplication, changed content, stale snapshots, missing observations, excluded employers and whitespace normalization. Database checks cover automatic backfill, repeat-run idempotence, posting version retention and preserving shortlist state when scope changes.

All ten routes were checked at 1280, 800 and 390px with no horizontal overflow. Browser checks covered queue counts and disjoint filtering, pagination, mobile selection/back, imports in Opportunities, source registration in Sources & scans and default pending-analysis selection. The live Staff Frontend profile contains 81 source candidates in Needs review; repeating backfill creates no additional changes. No applications, contacts, messages or job assessments were submitted by browser verification.

## Job card and toolbar detail — 5 October 2026

View options and Filters & sort use anchored popovers. Their content does not participate in row sizing. Outside clicks and Escape dismiss them, and Escape restores summary focus. Browser measurements confirm unchanged profile/search row heights with menus open at 1280, 800 and 390px; no horizontal overflow was observed.

Job cards now display readable provider names (including LinkedIn when it is the recorded source), company-board classification, publication date when supplied, observation/addition date, a two-line description excerpt and recruiter availability. Unknown publication dates and missing contacts remain explicit. Cards contain no nested interactive links within their selection buttons.

Selected-job details show source facts and hiring contacts. Only explicit job associations are labelled vacancy-linked. Exact company aliases can supply company contacts, whose vacancy ownership remains unverified. Contact details include title, recorded recruiting status, evidence date, profile/evidence links, source quotes and notes. The UI does not invent recruiter ownership, dates or provider coverage. A domain test verifies direct associations, canonical company matches and exclusion of similarly named unrelated employers.

Verification: 60 unit tests pass, typecheck and production build pass. Mobile selection/back and the real Palo Alto Networks company-contact display were checked without changing any workspace records or sending messages.
