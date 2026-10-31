# Attendie 2.0

SIT Nagpur's event-attendance coordination and leave-ledger app. Regular class attendance stays in Moodle.

## Local review

```bash
npm install
npm run dev:local
```

Open [localhost:3001](http://localhost:3001). Student, Faculty and Admin layout-review links appear only during local development. These previews contain no personal records or sample data.

Real sign-in is intentionally pending EkLink integration. Actual dashboard pages and APIs are locked; there is no fake-login fallback. See [local setup](docs/dev-login.md).

## Checks

```bash
npm test
npm run typecheck
npm run build
```

## Project handoff

Read [rules.md](rules.md), [architecture.md](architecture.md), [tracker.md](tracker.md), [phase.md](phase.md), and [plan.md](plan.md).

The user's real roster files remain in git-ignored `data/`, accessible only to the local server for the authorised workflow. Never commit or upload these records or environment secrets. The current local roster adapter is not a cloud database; deployments fail closed until approved data/auth integration exists.

Current dashboard implementation and manual results: [dashboard checks](docs/dashboard-checks.md). Business event/leave workflows and final EkLink integration remain in progress.
