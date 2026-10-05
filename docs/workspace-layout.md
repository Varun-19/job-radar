# Workspace layout

The daily search is the primary navigation: Today, Opportunities, Applications and Recruiters. Discovery and analysis are review queues. Profiles, résumé evidence, company preferences and connections sit under Search setup, which opens automatically when visiting one of those pages. The current page is visibly marked.

- Today groups notices into actionable counts rather than displaying every observation on arrival. Individual notices and acknowledgments remain available. Saved-job and application counts follow the selected profile. Résumé onboarding appears only before a résumé exists.
- Opportunities shows company, role, location and review state in the list. Company targeting still controls the default sort. Filters, example previews, manual assessments and full source descriptions are secondary controls. Desktop uses list and detail side by side; below 1150 pixels, selecting a job opens its detail with a Back to jobs action that preserves selection and keyboard focus. Canonical unknowns remain explicit and pending proposals are not accepted assessments.
- Discovery shows source candidates first. Company scan management is collapsed, respects the selected board filter, and exposes one employer's settings at a time. Existing scan and save behavior is retained. A separate advanced disclosure restores provider searches, public URL preview, JSON imports and adding boards. Discovery and Opportunities share company alias resolution.
- Recruiters shows saved people first, with each contact’s status, links, hiring quotes and notes behind a compact disclosure. Search and contact entry are deliberate actions. Add/edit places the editor above the list and focuses its first input. No messages are sent.
- Connections presents four concise cards: sources, email, job sites and assistant connection. Query limits, provider boundaries, delivery history, verification and client setup remain available within disclosures. Configured sources and MCP registration do not imply successful current scans or loaded client tools.

Verification: type checking, production build and 54 passing unit tests (database integration suite is opt-in). Browser checks covered email verification without sending, company filtering, full source text, contact entry/cancel, board-filtered scan settings, grouped navigation, and the narrow-window job/back flow. No job assessments or contacts were changed for layout verification.


## Review fixes — 5 October 2026

The responsive list/detail hiding rule is scoped to Opportunities. Applications and Evidence stack both panels below 1150px. Shared grids and long text shrink/wrap within the viewport.

Evidence uses three views: résumé versions with original download and collapsed extracted text; job checks with a version selector; and professional claims. Analysis shows pending proposals first, collapses historical assessments, and puts packet transfer/JSON import in Advanced. Target companies defaults to priorities and offers unclassified/all views with 20-row pages. Explicit aliases share one row, preference edits synchronize existing alias keys, and feed boards are excluded from employer rows. The full universe remains available.

Application follow-up alerts are filtered by their job’s active profile, consistently with Today’s summary. A regression test covers cross-profile, closed and future follow-ups.

Current verification: 55 unit tests pass, one opt-in database test skipped; typecheck and production build pass. All ten routes were checked at 1280, 800 and 390px. Additional interactions covered evidence views, restored discovery controls, company alias search, and application form entry/cancel. The live application tracker is empty; no artificial applications or contacts were saved to the user's workspace for testing. External provider delivery and SMTP credentials were not part of these UI fixes.
