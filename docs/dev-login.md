# Local app review — no persona login

Updated 31 October 2026. The user requested real college records and deferred EkLink integration until its project folder is attached. Earlier fake-login instructions are obsolete.

Run:

```bash
npm run dev:local
```

Open [Attendie locally](http://localhost:3001). No login credentials are needed to review the data-free layouts:

- [Student layout](http://localhost:3001/design/student)
- [Faculty layout](http://localhost:3001/design/faculty)
- [Admin layout](http://localhost:3001/design/admin)

These are local-development design previews. They do not sign anyone in, load a roster or call protected dashboard APIs. There are no sample users, sample event lists or made-up statistics. Production builds do not expose these preview routes or links.

Actual `/dashboard/*` pages and `/api/dashboard/*` endpoints remain locked until EkLink verifies identity. Old persona endpoints return 404, the old enabled flag no longer enables login, and legacy development cookies are rejected.

`npm run dev:full` remains available when Vercel CLI setup is complete. `npm run dev` is frontend-only.

## Real local records

The server reads roster spreadsheets/CSVs inside git-ignored `data/`. It never serves these files to browsers. This adapter works only in loopback local development and fails closed in deployments. No cloud upload was performed or authorized.

For an authorised signed-in student/faculty, the server selects the profile by verified session identity; it never accepts another person's PRN from a URL or request. Admin/viewer responses may include roster aggregates, not bulk personal records.

Optional private `data/access.json` is reserved for explicit office identities and app-role grants. Its schema is:

```ts
{
  identities?: Array<{ login_id: string; name: string; email: string; role: "staff" | "admin" }>;
  grants?: Array<{ login_id: string; app_role: "admin" | "organiser" | "viewer" }>;
}
```

Do not create accounts by guessing an ID or promote a faculty/HoD automatically. The office's actual identity and admin grant must be confirmed before integration. No access configuration has been created for the user.

## EkLink integration later

Attach the EkLink project folder and authoritative rules in this chat. Then implement code/state/token/JWKS checks and the session refresh/revocation lifecycle against that contract. `APP_SESSION_SECRET` is the canonical server-only session key (minimum 32 random characters); it does not by itself enable login. Login/callback currently return an unavailable response and never mint sessions.

The pending identity boundary validates signed session kind, signature, timestamps and 15-minute verification freshness, then rechecks roster/grants on each request. Authenticated manual testing remains pending real integration. See [dashboard-access-spec.md](dashboard-access-spec.md) and [dashboard-checks.md](dashboard-checks.md).

Run `npm test`, `npm run typecheck` and `npm run build` for checks. Isolated security fixtures exist only inside tests; the running app never uses them.
