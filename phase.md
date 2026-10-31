# Attendie 2.0 — Delivery Phases

Last reviewed: 31 October 2026. Current stage: Phase 2 dashboard foundations. User direction now uses real local roster data, removes fake login, and defers EkLink until its project folder is attached. Actual dashboards stay locked; local design previews contain no records.

Use [tracker.md](tracker.md) for completion evidence, [plan.md](plan.md) for the next work sequence, [architecture.md](architecture.md) for design, and [rules.md](rules.md) for constraints. A file existing does not mean its feature is complete.

## Phase 0 — Foundation

Handoff reports complete; repository scaffold and reusable code are present.

- Vite, React, TypeScript and Tailwind setup.
- Folder structure, domain types, date helpers and searchable dropdown.
- Event/roster parsers, PDF helper and dummy template downloaders.
- Git exclusions for real data and environment files.

Gate: a usable local scaffold with typecheck and build passing. Remote repository/setup status is reported by the handoff, not independently verified.

## Phase 1 — Verify imports and dev identity

Earlier dev-persona workflow was verified and then superseded by the user. Real local roster aggregates are now verified; fake login is disabled. Current results are in [dashboard checks](docs/dashboard-checks.md).

- Verify parsers and browser-only import tester using dummy CSVs.
- Real rosters may be parsed locally under current user authorisation, with aggregate diagnostics only. Never print or upload records.
- Historical persona testing is superseded: no fake users in the app. Real-data layouts are reviewed through data-free local previews.
- Fix dev-auth production blocking, secret fallback, role mapping and unsafe inspection output.
- Verify login, refresh, logout, role switching and direct unauthorized API requests.

Gate: typecheck/build and relevant tests pass; local roster aggregates and browser layout checks are recorded; legacy fake authentication is disabled. Authenticated browser verification waits for EkLink.

## Phase 2 — Event attendance MVP

In progress: Student/Faculty/Admin dashboard layouts, real local roster adapter and protected APIs are implemented. Actual event persistence and workflows below remain pending. EkLink is deferred by the user; do not introduce another login or a real-data bypass.

1. Review schema and permission specification; implement migrations, RLS and dummy seeding.
2. Add shared DB/guard/audit/validation utilities and rate limits for search/imports.
3. Build HoD Desk first: list by state, upload, review, match correction, manual entry, publish.
4. Build coordinator create/upload/draft/submit flow and PDF export.
5. Build faculty date + batch/section view and marking checklist.
6. Build student own-events view and marking requests.
7. Add in-app notifications for publish, request and marking actions.

Gate: the entire event workflow works with dummy data, server-side permissions and audit records. Moodle changes remain manual.

## Phase 3 — Verify event workflow

Not started.

- Exercise clean uploads, duplicates, malformed PRNs, missing headers and unmatched/missing-batch students.
- Verify publish, marking, student requests and notifications.
- Call APIs directly under wrong roles/owners; verify 401/403 and data isolation.
- Check transaction failures, repeated submissions and duplicate acknowledgements/requests.
- Check desktop HoD workflow and mobile faculty/student screens.
- Check performance with 150-row and 400-row dummy sheets.

Gate: written results and no known blocking issues in Case 1.

## Phase 4 — Leave and condonation ledger

Not started.

- HoD-office leave entry, editing and audit history; optional existing-ledger import.
- Student own leave history and approved totals.
- Define and implement admin Moodle-percentage import and reference attendance meters.
- Reports by student, type and batch; Excel export; read-only viewer access.

Gate: the office can use a complete dummy semester instead of its leave spreadsheet. The app displays evidence; HoD retains condonation authority.

## Phase 5 — Final verification

Not started.

- Regression for both workflows; security review against authoritative EkLink rules.
- Accessibility, mobile, empty/error states and deployment configuration checks.
- Complete README, environment instructions and operational documentation.
- Remove unused code/dependencies and isolate/remove dev tooling before production.

Gate: reproducible checks, documented setup and no known release blockers. Full EkLink runtime checks finish during Phase 6.

## Phase 6 — EkLink and deployment

Not started. Earlier phases use dummy data and temporary development identity only.

- Obtain authoritative EkLink integration document and rules.
- Implement and test EkLink login; remove/disable fake identity routes and production dev UI.
- Register slug `attendie`, allowed roles and callback URL with EkLink admin.
- Provision deployment environment, Supabase settings and headers; bootstrap first admin by controlled SQL.
- Run EkLink checklist 1–12 and record results; request the app be switched live.
- Load real data only after explicit college approval.

Gate: verified EkLink integration, production dev-auth exclusion, deployment checks and approval for any real-data usage.

## Phase 7 — Optional later work

- OCR with mandatory human review.
- Email notifications.
- Timetable-linked faculty visibility.
- Stable event IDs and app contracts for ApproveIt/TemplateOS.
- HoD/director analytics.

These features do not block the initial release.
