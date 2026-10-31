# Phase 1 verification — 31 October 2026

Historical verification record. Current user direction removed the persona workflow. See [dashboard-checks.md](dashboard-checks.md) for the replacement access checks and real local roster aggregates.

Scope: local development with dummy data. These results do not claim EkLink integration, database functionality or Vercel deployment verification.

## Automated checks

- `npm test`: 16 tests passed. Covers all five personas, admin authorization, disabled/unset flag, Node production, Vercel production/preview, remote/lookalike hosts, missing/weak/example secrets, legacy secret alias, tampered/malformed/expired/future/overlong/forged sessions, role mapping, invalid payloads/methods, cross-origin mutations and logout.
- Parser cases: 60 dummy students, eight dummy faculty, title/repeated-header and headerless rosters, invalid fields, duplicates, semester boundaries, event participant roles, unmatched IDs, pasted PRNs, 150/400-row dummy sheets, aggregate privacy sentinel test.
- Typecheck includes application, APIs, scripts and tests.
- Production build excludes the dev import tester/spreadsheet library from its application bundle; latest measured JS output is approximately 227.54 kB (71.20 kB gzip), down from 660.51 kB before isolation. No bundle-size warning remains.

## Manual browser checks

Actual UI interaction in the in-app browser using `http://localhost:3001` and the local fallback server running the same auth handlers.

| Check | Observed result |
| --- | --- |
| HoD-office ADMIN login | Correct identity and HoD Desk landing |
| Refresh while authenticated | ADMIN session preserved |
| Logout and role switching | Returned to persona selector; subsequent roles switched correctly |
| FACULTY login | FACULTY badge and Day View, not ORGANISER |
| STUDENT login | STUDENT badge and My Events |
| Student ORGANISER login | ORGANISER badge and My Organised Events |
| VIEWER login | VIEWER badge and Reports |
| Direct admin-only API navigation | Admin access verified; student receives insufficient-permissions error |
| Dummy student CSV | 60 valid, 0 invalid, 0 duplicates |
| Dummy faculty CSV | 8 valid, 0 invalid, 0 duplicates |
| Faulty roster fixture | 1 valid, 2 invalid, 1 duplicate; missing section and invalid email/role shown |
| Faulty event fixture | 3 parsed, 1 invalid, 1 duplicate; 2 matched and 1 unmatched |
| Headerless event fixture | 3 parsed, 0 invalid/duplicates; autodetection warning shown; 2 matched and 1 unmatched |
| Corrupt XLSX | Visible generic error; previous results cleared |
| Student Excel template download/re-upload | 1 valid, 0 invalid/duplicates |
| Faculty Excel template download/re-upload | 1 valid, 0 invalid/duplicates |
| Event Excel template download/re-upload | 1 parsed, 1 matched, no invalid/duplicates/unmatched |
| Narrow mobile view | Controls wrap; no horizontal overflow in inspected view (effective DOM viewport/content width 325 px) |
| Dev flag disabled on port 3002 | No persona buttons; existing dev cookie not accepted; Dev Login Disabled screen |

The viewport override was reset after checking. Test fixtures contain dummy data only. The corrupted workbook was created in a temporary directory. Downloaded templates are dummy workbooks.

## Fix discovered during manual testing

Student/Faculty templates previously used legacy master columns and could not round-trip through the roster tester. Both now use `login_id, name, email, role` plus `batch, section` for students. Semester remains derived.

## Limits and remaining work

- Real files were not read or uploaded by the agent. Yash must verify them locally and report aggregate counts: 273/330/343 valid students, one missing-section row, 48 valid faculty/staff as reported in the original brief.
- The provisional semester calendar and PRN-format exceptions still need college confirmation.
- Vercel CLI could not run here without login/network access; deployed runtime parity remains unverified. The local fallback binds only to loopback and registers Phase 1 routes explicitly.
- Business screens remain landing previews. No database migrations, app-role DB rows, event/leave workflows or notifications have been implemented.
- This development session design does not centrally revoke copied tokens on logout. It is replaced in Phase 6.
- No commit, push or deployment has been performed; Yash requested review first.
