# Attendie 2.0 — Working Plan

Last reviewed: 31 October 2026.

## Start here

Read [rules.md](rules.md), [architecture.md](architecture.md), [tracker.md](tracker.md), then [phase.md](phase.md). Current implementation evidence is in [dashboard-checks.md](docs/dashboard-checks.md).

## Accepted direction

Build the app first; attach the EkLink project folder in this chat later for integration. Use the supplied real roster locally. No fake accounts, demo records, guessed admin grants or invented event/attendance statistics. No cloud upload is authorised.

Local design previews allow reviewing Student/Faculty/Admin layouts without exposing records. Actual dashboards and data APIs remain locked. Roster files identify records; they do not authenticate users.

## Completed foundation

- Three role-specific responsive workspace layouts, navigation and honest unavailable states.
- Server-only real roster adapter and aggregate diagnostics: 946 usable students and 48 faculty-file rows, one missing section.
- Exact-role dashboard APIs and student own-record isolation.
- Disabled fake-login routes and old cookies, protected private-file URLs and cloud-denied local adapter.
- Automated role/identity/privacy checks, manual layouts/mobile/locked routes and production-preview exclusion.

## Next — event schema and HoD workflow

Before persistence, specify:

- Identity references for students, faculty, office staff and explicit app-role grants.
- Faculty coordinator capability without granting student organisers faculty permissions.
- Whether multiple classes/faculty need separate acknowledgements for the same event/student.
- Marking-request recipients without timetable data.
- Historical batch/section membership and correction rules.
- Controlled unmatched-student handling and event state transitions.
- Atomic publication, duplicate prevention and append-only audit writes.

Then implement approved migrations/RLS and a storage adapter. Real local records must not be copied into Supabase/free-tier hosting before college approval. Do not silently replace them with dummy application data.

Build the office workflow first: event list, create/upload/paste, match preview, corrections, save/submit, admin review and publication. Then coordinator ownership/PDF, faculty batch/section marking acknowledgements, student follow-ups and notifications. Every handler checks verified identity, role, ownership and input.

## EkLink integration checkpoint

When Yash attaches the folder, read its authoritative rules and integration contract before implementing login. Verify state/code exchange/JWKS/token claims, identity mapping, cookie/session refresh and revocation. Configure the actual office account and explicit admin grant. Run the role matrix through real browser sessions before claiming authenticated end-to-end security.

No manual signed-cookie bypass, PRN-only sign-in, impersonation switch or test account is permitted in the running app.

## Leave and release

After event workflow verification, build the leave ledger and an explicitly defined Moodle-percentage input. HoD keeps condonation authority. Complete accessibility/security/regression and deployment checks. Deploy or upload real data only under the required user/college authorisation.

## Handoff and GitHub

Update tracker.md with completed behavior, actual checks and remaining limits. Review current changes with Yash. Only after approval, create meaningful commits grouped by documentation, access/data boundaries, and dashboard UI/verification. Inspect pre-existing uncommitted work before staging, and exclude private data, secrets and generated output.
