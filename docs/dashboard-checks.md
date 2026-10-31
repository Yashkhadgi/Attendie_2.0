# Dashboard implementation and verification

31 October 2026. Scope: Student, Faculty and Admin layouts, real local roster adapter, and fail-closed access boundaries. EkLink integration was explicitly deferred by the user until its project folder is attached.

## Implemented

- Shared responsive workspace with role-specific overview, sidebar navigation, event/leave/request states, profile area, help and privacy information.
- Student layout: personal event attendance, marking follow-ups, own leave/profile areas.
- Faculty layout: event-attendance desk, acknowledgements and student marking requests. No student-only leave/profile access is granted to faculty.
- Admin layout: event review desk, roster coverage/quality and office priorities. Roster aggregates are served only to authorised office/viewer roles.
- Local `/design/student`, `/design/faculty`, `/design/admin` previews contain no personal data, accounts, sample records or invented statistics. No protected-data calls are made by these views.
- Actual dashboard endpoints enforce identity plus exact role. Student responses serialize only their own profile. Arbitrary identity selectors are rejected.
- Old fake-login routes and legacy cookies are disabled. Real login/callback are explicitly unavailable until integration.
- Local real rosters are read server-side only. Static private-file access is blocked by both the local server and Vite filesystem deny rules. Cloud/production use of this local adapter is denied.
- Browser dashboard state is cleared on identity/role changes and revalidated after focus/history/visibility changes. A prior user's response cannot be rendered under another current identity.

## Real roster evidence (aggregates only)

Local parsing was explicitly authorised by the latest user instruction. No personal rows were printed, copied into source, or uploaded.

- Valid students: **946** (273 from 2024–28, 330 from 2025–29, 343 from 2026–30).
- Teaching faculty: **45**. Other faculty-file leadership/staff rows: **3**. Total faculty-file rows: **48**.
- Invalid rows: **1** (missing section). Duplicate rows: **0**.
- Missing-section record is excluded from the usable master until corrected. No source file was edited.
- No HoD-office identity/admin grant was invented from the available faculty list.

## Automated verification

`npm test`: **19 tests passed**, including all **25** role × dashboard combinations, own-student isolation, grant checks, stale/missing/changed identities, identity-selector rejection, method checks, cookie validation, expiry/freshness, cloud/remote denial, disabled upstream session issuance and legacy-login regression. Test-only abstract identities never enter the app or real roster.

`npm run typecheck`: passed. `npm run build`: passed (latest JS approximately 251.83 kB, 78.59 kB gzip; no bundle warning). `git diff --check`: passed.

Local HTTP smoke checks: three dashboard APIs reject unauthenticated access (401), old persona login returns 404, unfinished real login returns 503; seven private-file URL variants are blocked (403/404). Bodies from private-file tests were not printed.

## Manual browser verification

- Student overview, event page, leave page and help navigation.
- Faculty overview and event-attendance page; role-specific profile labels.
- Admin overview and college-roster page; previews show no real aggregate/personal records.
- Mobile navigation opens, selecting a section closes it, and hidden sidebar is removed from normal visible navigation. Inspected narrow DOM viewport: 325 px; content width 313 px (no horizontal overflow).
- Direct actual dashboard URLs for Student, Faculty and Admin show the protected sign-in gate without revealing records.
- Production-build preview contains no design links, and `/design/admin` shows Page not found.
- Old development identity in the browser no longer signs the user in.
- Viewport override reset after manual checking. Screenshots contain layout-only previews, no personal data.

## Remaining work

- EkLink protocol integration and authenticated browser tests with real identities; upstream refresh/revocation and logout.
- Approved database/schema and persisted event workflow: upload, matching, office review/publication, faculty acknowledgements, student requests and notifications.
- Leave ledger in its planned later phase. No event/leave counts or attendance percentages are fabricated.
- Fix the one blank section at source, resolve missing batch/role mapping questions and configure the actual office identity explicitly.
- No deployment, commit or push performed; GitHub changes await user review.
