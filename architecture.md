# Attendie 2.0 — Architecture

Last reviewed: 31 October 2026. Owner: Yash. College: SIT Nagpur.

Current user decision: use real roster files locally, no fake-login accounts, and defer EkLink until its project folder is attached. Student/Faculty/Admin dashboard layouts and server access boundaries are implemented. Local `/design/*` previews expose no records; actual dashboards remain locked. See [current dashboard checks](docs/dashboard-checks.md). The Supabase architecture below remains the target, not an implemented database.

Read [rules.md](rules.md) before making changes. See [tracker.md](tracker.md) for actual implementation status; this document describes the intended design unless explicitly marked implemented.

## Product boundary

Attendie handles event attendance coordination and a leave/condonation ledger. Moodle remains the system for regular class attendance. Attendie never writes to Moodle: a faculty tick means “I marked this student in Moodle.”

The primary operational user is the HoD office, currently Ashish Bawankar. Design that workflow first. Real roster access is authorised locally; cloud data handling still requires college approval.

## Target system

```text
Browser: Vite + React + TypeScript + Tailwind
    | same-origin /api/* requests, HttpOnly session cookie
    v
Vercel Functions: TypeScript
    | validate session, permission, DB ownership, input
    | server-only Supabase secret/service credential
    v
Supabase Postgres: RLS enabled on every application table
    no browser-facing policies; access through server only

EkLink -> server-side login callback -> Attendie session
Faculty -> manually updates Moodle outside Attendie
```

The browser must not query Supabase directly or receive database credentials. Because the server credential can bypass RLS, API authorization is mandatory; RLS alone does not protect server requests.

Local full-stack commands: `npm run dev:full` (`vercel dev --listen 3001`), or `npm run dev:local` for a loopback-only Vite + current auth-handler fallback without a Vercel account. The fallback has an explicit route allowlist that must be extended for new APIs. EkLink uses port 3000. `npm run dev` runs only Vite. Hosting target: Vercel and Supabase free tiers with dummy data; deployment is not yet verified.

## Authentication and permissions

Final authentication is EkLink only. The handoff specifies authorization-code flow, a state cookie, server-side token exchange, JWKS ES256 verification, an Attendie HttpOnly session cookie capped at eight hours, and refresh/revalidation every 15 minutes. Verify exact behavior against the missing EkLink integration document before implementation.

`app_roles` is keyed by `login_id`. Derive permissions on the server using verified EkLink identity and database grants.

| Role | Intended source and permissions |
| --- | --- |
| STUDENT | EkLink student; own event rows, own leave records, own marking requests |
| FACULTY | EkLink faculty; published event section views and marking acknowledgements; may coordinate events |
| ORGANISER | Explicit organiser grant, including promoted students; manage own events and uploads |
| ADMIN | EkLink staff/admin plus explicit admin grant; review/publish, master imports, leaves, roles, audit and reports |
| VIEWER | EkLink hod/director plus explicit viewer grant; read-only reports |

Faculty coordination is an intended capability; model its relationship to the ORGANISER role before finalizing guards. An organiser grant must not accidentally remove faculty capabilities. Unsupported role/grant combinations must not silently gain privileges. Clarify deputy-director mapping with the EkLink team.

Current implementation: old development sessions and persona endpoints are disabled. A separate signed EkLink session boundary checks identity, timestamps and verification freshness; no endpoint issues sessions until EkLink integration is implemented. Each dashboard request re-resolves role from the local master and explicit private grants. No PRN-only login is provided. The old [Phase 1 auth specification](docs/phase-1-auth-spec.md) is historical; the [dashboard access specification](docs/dashboard-access-spec.md) supersedes it.

The temporary local adapter reads only git-ignored roster sheets under `data/`, with aggregate summaries and optional explicit office/grant configuration in `data/access.json`. It denies cloud/production access. Student/faculty responses contain only the caller's profile; admin/viewer responses may include aggregate roster coverage. No database or cloud import was performed.

## Main workflows

### Event attendance

1. Coordinator or HoD office creates an event and uploads a participant sheet or pastes PRNs.
2. Match PRNs to the student master; show duplicates, invalid rows and unmatched PRNs for correction or controlled manual entry.
3. Store a role per attendee: participant, organiser or volunteer.
4. Coordinator submits the draft for review; only HoD-office ADMIN publishes.
5. Notify faculty. Faculty choose date, event, batch/semester and section, then acknowledge students they have marked in Moodle.
6. Students see their own event status and marking faculty; “Please mark mine” sends a request to a faculty member.

Event states: `draft -> in_review -> published -> closed`. Coordinators edit only their own drafts. Define correction, return-to-draft, closure and reopening rules before implementing additional transitions. Faculty marking requires a published event. All mutations are audited.

Section letters repeat across batches. A section filter must identify the batch as well as the section. Faculty choose sections themselves for MVP; timetable restrictions are deferred.

### Leave ledger

HoD office records leaves with type, dates, day count, reason and approver. Students see their own approved totals. A later admin-imported Moodle percentage feeds reference meters for 75% and special-case 65%; approved days alone cannot determine attendance percentage. HoD decides condonation; the app never automatically grants it.

## Draft data model

No schema is implemented yet: both migration files are empty. Finalize constraints, foreign keys, indexes and transactional operations before applying migrations.

| Table | Main data / constraints |
| --- | --- |
| `students` | PRN primary key, name, email, batch, section, active status |
| `faculty` | login_id primary key, name, email, raw role, EkLink subject, status |
| `app_roles` | login_id primary key, admin/organiser/viewer grant, granted_by |
| `events` | title, category, date/times, venue, coordinator login_id, state |
| `event_participants` | event, student PRN, participant role, mark status, marker/time; unique event + PRN |
| `mark_requests` | participant row, student PRN, target faculty, state, creation time |
| `notifications` | recipient login_id, title/body/link, read status, creation time |
| `leave_records` | student, type, dates, days, reason, state, approver, entered_by, creation time |
| `audit_logs` | actor, action, entity/id, old/new data, timestamp; append-only |
| `import_batches` | Optional import provenance and traceability |

Semester is derived from batch and date, never persisted as authoritative student data. Current assumption: odd semesters July–December and even semesters January–June, semesters 1–8. Confirm the college rule. Snapshot semantics for historical section/batch membership remain a design decision.

Before schema review, resolve: identity references for non-faculty staff, handling unmatched students, multiple faculty acknowledgements for one student/event, request recipient selection without a timetable, duplicate request prevention, and Moodle-percentage source/denominator for the leave meter.

## Code layout

| Location | Responsibility |
| --- | --- |
| `api/_lib/` | Session/auth, database access, guards, audit, validation, rate limiting |
| `api/<feature>/` | Server endpoints with permission checks |
| `src/features/` | Role and feature screens, import tooling |
| `src/components/ui/` | Reusable UI components |
| `src/lib/`, `src/types/` | Shared helpers and provisional domain types |
| `supabase/migrations/`, `supabase/seed/` | Reviewed schema and dummy seed data |
| `scripts/`, `tests/`, `docs/` | Local utilities, verification and supporting documentation |
| `data/` | Git-ignored private real files; agents must not read or print them |

Configuration names are documented in `.env.example`; secrets belong in local/deployment environment settings. `APP_SESSION_SECRET` is the canonical signing key; legacy `SESSION_SECRET` and persona flags no longer enable authentication. All service URLs must remain configurable for a later college-domain move.

The root-level architecture.md is the maintained architecture document. The existing empty `docs/architecture.md` is a scaffold, not an additional source of truth.
