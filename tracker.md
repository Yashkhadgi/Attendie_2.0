# Attendie 2.0 — Progress Tracker

Last reviewed: 31 October 2026. Current work: Student, Faculty and Admin dashboard foundations plus real local roster access. EkLink integration explicitly deferred by the user until its project folder is attached.

## Accepted direction

- No fake/demo accounts, seeded records or invented metrics in the running app.
- Use supplied real roster files locally. No cloud upload, private records in chat/logs, or committed data.
- Local design previews are data-free. Actual dashboards and APIs stay locked until verified EkLink sign-in.
- User review precedes meaningful commits and GitHub push; neither has been performed.

## Current snapshot

| Item | Status | Evidence / limitation |
| --- | --- | --- |
| Student dashboard layout | Implemented and manually reviewed | Overview, events, leave, own-profile areas and help; no fabricated records |
| Faculty dashboard layout | Implemented and manually reviewed | Event-attendance desk, acknowledgements, marking requests and own profile |
| Admin dashboard layout | Implemented and manually reviewed | Office priorities, review area, roster coverage/quality |
| Responsive workspace/navigation | Verified locally | Desktop previews, mobile menu, route locks and production preview exclusion |
| Real local roster adapter | Verified with aggregate output | 946 valid students, 45 faculty + 3 leadership/staff, 1 invalid row |
| Dashboard APIs / role boundary | Implemented and tested | Exact-role checks, own-profile responses, explicit admin/viewer grants |
| Private file protection | Verified locally | Seven file-URL variants blocked; filesystem deny rules configured |
| Fake login | Removed/disabled | Persona endpoints return 404; legacy cookies rejected; old flags ignored |
| Actual sign-in | Deliberately deferred | Login/callback return unavailable, never issue sessions |
| Authenticated manual dashboard tests | Pending EkLink | No test account or manual bypass introduced |
| Supabase/schema | Pending | Migration files still empty; local adapter is transitional |
| Business event workflow | Pending | Upload/review/publish/mark/request/notification persistence not built |
| Leave workflow | Pending | Layout only; ledger and percentages unavailable |
| Deployment | Not performed | Local real-data adapter denies deployment environments |

## Verification

Full results: [docs/dashboard-checks.md](docs/dashboard-checks.md). Access contract: [docs/dashboard-access-spec.md](docs/dashboard-access-spec.md). Setup: [docs/dev-login.md](docs/dev-login.md).

- `npm test`: **19 tests passed**, including the complete **25-combination** role/dashboard matrix.
- `npm run typecheck`, `npm run build`, `git diff --check`: passed.
- Latest measured production JS: approximately **251.83 kB / 78.59 kB gzip**, no size warning.
- Three protected API checks reject unauthenticated users; legacy login returns 404; unfinished EkLink login returns 503.
- Student/Faculty/Admin protected browser routes all show the sign-in gate.
- Production build has no design links and no `/design/admin` route.
- UI previews and isolated security fixtures do not create application identities or alter real files.

## Real roster aggregates

Verified locally under explicit user authorisation; no personal rows printed:

| Batch | Usable students |
| --- | ---: |
| 2024–28 | 273 |
| 2025–29 | 330 |
| 2026–30 | 343 |
| Total | 946 |

Faculty file: 48 rows (45 faculty, one HoD, one director, one deputy director). One student row has no section and is excluded from the usable master until corrected. No duplicate rows found. Private source files were not modified.

## Next implementation tasks

- [x] D-01: Remove fake-login access and reject legacy development cookies.
- [x] D-02: Add real local roster parsing and role resolution without exposing files.
- [x] D-03: Add Student/Faculty/Admin workspace layouts and navigation.
- [x] D-04: Add protected dashboard APIs and own-profile serialization.
- [x] D-05: Verify role matrix, privacy, direct routes, mobile navigation and production design exclusion.
- [ ] E-01: Review event schema/state transitions and acknowledgement semantics before persistence work.
- [ ] E-02: Build HoD event create/upload/match/review/publish workflow.
- [ ] E-03: Build faculty acknowledgements, student marking requests and notifications.
- [ ] AUTH-01: Attach/read authoritative EkLink project and integration rules when ready.
- [ ] AUTH-02: Implement upstream code/state/token/JWKS verification and refresh/revocation.
- [ ] AUTH-03: Register the real office identity/admin grant and manually verify authenticated role isolation.
- [ ] DATA-01: Correct the blank section at source; decide whether to include 2023–27.

## Open decisions

Confirm semester calendar, PRN exceptions, deputy-director role mapping, actual office account, historical roster snapshots, marking-request recipients without timetable, and per-class/per-faculty acknowledgement semantics. Faculty choosing their own batch/section remains the MVP choice.

## Working tree and review

Uncommitted work predates this session; preserve it. Current changes include documentation, earlier parser work and the new dashboard/access implementation. No commit, push, deployment or cloud data import has occurred. After user approval, review and stage meaningful groups; never include `data/`, environment secrets, generated build output or screenshots containing records.
