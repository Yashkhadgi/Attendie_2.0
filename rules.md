# Attendie 2.0 — Project Rules

Last reviewed: 31 October 2026. Read before planning, editing, testing or deploying.

## Source of truth

- Follow the user's current instructions and applicable environment instructions.
- This file captures project constraints from the supplied Attendie handoff. architecture.md describes design; phase.md defines delivery gates; tracker.md records evidence; plan.md defines execution order.
- When available, the authoritative EkLink `rules.md` governs EkLink integration details over conflicting Attendie design notes. The referenced `EkLink-Integration-Attendie.md` and external rules were not available during this review; do not claim compliance or invent missing requirements.
- Distinguish target design from implemented behavior and verified results. Empty files are scaffolds, not completed features.

## Product boundaries

1. Moodle stays. Attendie never replaces Moodle or writes attendance into it.
2. A faculty tick records acknowledgement of manual Moodle marking; user-facing wording must make this clear.
3. Prioritize event attendance and HoD-office screens. Leave ledger follows a verified event workflow; OCR, email and timetable linking are later enhancements.
4. HoD decides condonation. The app shows leave totals and reference percentages; it does not auto-approve eligibility.
5. Faculty choose sections themselves for MVP. Distinguish batches when section letters repeat.

## Data privacy

Current user instruction (31 October 2026) supersedes the earlier dummy-only local workflow: use the supplied real faculty/student files locally for dashboards. Server-side parsing and aggregate-only inspection are authorized. Do not print real records into chat/logs, expose files publicly, commit them, or upload them to cloud services. Production/cloud handling still requires separate college approval. Do not use dummy personas or seeded records in the running app.

- No fabricated accounts or records in the running app. Test fixtures are isolated to automated tests. Real data stays local; college approval is required before cloud handling.
- Real files belong only in git-ignored `data/`. Access them programmatically on the local server for the authorized workflow; expose only aggregate diagnostics to the agent. Never print, paste, upload or commit their records.
- Inspect authorised real files locally through server code and expose aggregate diagnostics only. Do not request real rows or screenshots containing personal data in AI chats.
- Inspection output must be aggregates only: counts, distributions and generic validation reasons. Do not print rows, identifiers, emails or presumed headers from private files.
- The aggregate-only inspection script may be run for the currently authorised local workflow. Never change it to print names, IDs, emails, filenames or raw cells.
- Preserve exclusions for `data/`, `.env*`, generated outputs and real spreadsheets; keep `.env.example` free of secrets.

## Authentication and authorization

- EkLink is the only production login. No final password/signup flow, demo accounts or hard-coded user access.
- Fake/persona login is disabled in all environments. Old flags and development cookies must not re-enable it. Local design previews have no private-data access and are absent from production routes.
- Require a configured strong signing secret. Never silently substitute a known secret.
- No secrets, signing keys or Supabase server credentials in browser code, logs, committed files or API responses.
- Do not store tokens or user objects in localStorage. Browser identity state is not an authorization source.
- Derive roles from verified identity and DB grants on the server. Do not trust role, owner, student identity or coordinator identity supplied by a request body.
- Every protected API requires session validation, permission checks, applicable ownership checks against DB state, and input validation. A hidden button is not security.
- HoD/director viewing and staff/admin administration require explicit app-role grants. Unsupported identities must not silently receive a privileged fallback role.
- Coordinators edit only their own drafts; only ADMIN publishes; faculty mark published events; students access only their own records; viewers have no mutation permissions.
- Rate-limit search/import and abuse-prone request paths. Return only data needed for the caller's task.
- Review a written auth/security/RLS specification before implementing those changes; review the resulting diff. The original handoff requested Claude review; preserve the review step without requiring one particular model. No additional approval ritual is implied unless required by the user or integration contract.

## Database integrity

- Supabase access is server-only. Enable RLS for every application table; no browser-facing policies in the intended architecture.
- Server credentials bypass RLS, so API guards remain mandatory.
- Audit every business mutation server-side. Keep audit records append-only and protect them against application update/delete paths.
- Use constraints and transactions where related writes must succeed together, including participant uniqueness, state changes and audit writes.
- Derive semester from batch and date; do not persist it as authoritative roster truth.
- Current semester calendar and 11-digit PRN assumptions need confirmation before strict production enforcement. Do not silently change parser rules without documenting the decision.

## Development discipline

- Inspect existing work and applicable project instructions first. Preserve unrelated/uncommitted changes.
- Make focused changes; avoid unrelated refactoring, reformatting or dependency updates.
- Use environment variables for service URLs and credentials; support later migration from Vercel to college domains.
- Use `npm run dev:full` or the loopback-only `npm run dev:local` fallback for API-backed local flows; `npm run dev` is frontend-only.
- After code changes, run `npm run typecheck`, `npm run build` and relevant focused tests. Record failures and limitations truthfully. Documentation-only edits need link/content verification, not new application tests.
- Run the automated suite with `npm test`; run only dev-login tests with `node --import tsx --test tests/dev-login.test.ts`.
- A passing build does not prove authentication safety, workflow correctness, migrations applied or deployment success.
- Do not commit, push, deploy, register a live integration or load real data without user authorization for that action. The handoff's conflicting “commit after each step” instruction is interpreted as a preference for small commits once committing is authorized.

## Documentation maintenance

- Update tracker.md after meaningful implementation or verification, and phase.md when a phase gate is actually met.
- Update architecture.md and plan.md when accepted design decisions change.
- Record external questions explicitly rather than inventing college policy, identity mappings or approvals.
- Keep private data and secret values out of all documentation and change summaries.
