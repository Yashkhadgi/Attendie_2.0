# Phase 1 development identity specification

Historical document. Superseded on 31 October 2026 by [dashboard-access-spec.md](dashboard-access-spec.md). The user requested real local records and removal of fake login; all persona routes/cookies are now disabled. The specification below records earlier work, not the current login contract.

Reviewed for implementation on 31 October 2026 against the root project rules. This is temporary local identity, not the EkLink production contract.

- Enable only when `DEV_FAKE_LOGIN=true`, `NODE_ENV=development`, and `VERCEL_ENV` is absent or `development`. Reject remote deployment environments and non-loopback request hosts/peers. Compare exact hostnames, never a prefix such as `localhost.evil.example`.
- Apply the same development boundary to session verification as to session creation: switching the flag off or moving to production invalidates development cookies.
- Mutating auth requests use POST and reject a supplied Origin that differs from the local request origin. Mark auth responses `Cache-Control: no-store`.
- Require at least 32 characters of configured secret, reject known example/fallback secrets, and use `APP_SESSION_SECRET` as the canonical key (`SESSION_SECRET` is a temporary legacy alias). Login returns a generic 503 when misconfigured; verification fails closed.
- Sign a versioned `attendie-dev-v1` payload with HMAC-SHA256. Validate signature, payload shape, integer issue/expiry times, expiry at the exact boundary, and a maximum lifetime of eight hours. Match identity/role fields to the current server-owned dummy persona registry; ignore roles supplied by the browser.
- Cookies are HttpOnly, SameSite=Lax, Path=/ and capped at eight hours. Omit Secure only for explicit local development on loopback; malformed cookie encoding must return unauthorized rather than crash.
- Use five fixed dummy personas aligned with seed IDs: ADMIN (staff + admin grant), FACULTY (faculty), STUDENT (student), ORGANISER (student + organiser grant), VIEWER (hod + viewer grant). Remove environment overrides that could introduce real identities or convert the viewer selector into an admin.
- Role mapping allows admin only for staff/admin with an admin grant, viewer only for hod/director with a viewer grant, and organiser only for student/faculty with an organiser grant. A faculty organiser remains FACULTY for now, preserving faculty access; faculty coordinator capability is specified in Phase 2. Reject unknown roles/grants instead of guessing.
- The browser checks server dev status and its own development build flag before exposing dev controls. Import tooling is development-only and lazy-loaded. Login/logout failures remain visible; logout does not falsely clear UI state after a failed server response.

Verification: missing/weak secrets; disabled/production/preview/remote-host login and cookie reuse; tampering; malformed cookies; expired/future/overlong sessions; forged or obsolete roles/identities; persona permissions; cross-origin mutation; refresh/logout. Manually exercise all five personas, dummy roster/event imports, and a mobile-width view. Only Yash performs private-file browser verification.

Development logout clears the browser cookie; copied tokens are not centrally revoked before their expiry. Phase 6 must replace this implementation with the authoritative EkLink session lifecycle. No DB ownership claims are made in Phase 1.
