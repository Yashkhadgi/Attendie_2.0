# Dashboard access specification

31 October 2026. User direction: real local roster only; remove fake/demo login from the app. No cloud import is authorized.

## Identity boundary

- Knowing a PRN, staff ID or email is not authentication. Roster files supply profiles/eligibility, not proof of identity.
- Disable all development persona routes and reject existing development session cookies.
- Admit only server-signed sessions with a distinct EkLink session kind, verified subject/login ID/role and valid bounded timestamps. No browser endpoint may mint such a session until the authoritative EkLink code/token verification flow is implemented.
- The current EkLink login/callback modules and database migrations are empty; the upstream integration contract is missing. Login/callback must fail closed rather than invent a contract. The UI explicitly states sign-in setup is pending.
- Resolve access on every request from the verified session plus the current server roster and explicit local grants. Reject missing, unsupported, conflicting or changed identities. No role is taken from the browser or a dashboard URL.
- Admin requires verified EkLink staff/admin role plus a private `app_roles` grant. Viewer requires hod/director plus viewer grant. Faculty/student are their verified respective roles. Organiser grants do not confer admin or faculty privileges.
- Local real-data access is loopback-development only. Local storage is a transitional adapter; deployments fail closed until an approved database/auth setup replaces it.

## APIs

`GET /api/dashboard/student`, `/faculty`, `/admin`, `/organiser`, `/viewer` each require their exact role. Student organiser access to a student profile must be an explicitly permitted capability, not a wildcard role match. Unsupported routes return 404; missing auth 401; mismatched role 403. Reject selectors such as `prn`, `login_id` or `user_id`; the server chooses the identity from the session. All responses are no-store.

- Student response includes only the caller's profile. No roster list or other student's identity is serialized.
- Faculty response includes only the caller's profile; any institution-level counts are non-personal aggregates. Event/class records remain unavailable until backed by storage.
- Admin response includes roster aggregates and import quality counts. This initial dashboard does not expose bulk real roster rows.
- Event/leave/notification statistics must show unavailable or an honest empty state until their source exists; never invent counts, attendance percentages or activity.
- A browser route guard improves navigation, but the API is the security boundary. Clear cached dashboard state on logout, role/path changes and authorization failure. Browser history/refresh cannot bypass server checks.

## Verification

Check the entire role × dashboard matrix, unauthenticated access, legacy dev cookies, expired/future/tampered sessions, identity changes, forged selectors, missing grants and disabled cloud access. Test identities may be used only inside isolated security tests; the app and manual review must not offer test accounts or fabricated records. Manual checks on the live local app must confirm sign-in gating and blocked direct API/URL access while EkLink is unavailable. Authenticated dashboard browser verification remains pending real integration.
