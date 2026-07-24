# CI and test baseline

The required GitHub Actions workflow runs for pull requests and pushes to
`main` on Ubuntu with Node.js 20. It installs the lockfile with `npm ci`, then
runs formatting, lint, the passing TypeScript package check, CI-safe tests, and
the production build as separate required steps. No step uses
`continue-on-error`, shell fallbacks, or ignored exit codes.

The exact commands are:

```sh
npm ci
npm run format:check
npm run lint
npm run check
npm run test:ci
npm run build
```

The workflow has no database URL or production credentials, does not start the
application, and never accesses the production database.

## Test classification

`npm run test:ci` (also exposed as `npm run test:unit`) is deterministic and
does not require PostgreSQL, credentials, seeded data, or an already-running
application. It covers:

- request IDs, body limits, sanitized errors, and upload compatibility;
- authentication, authorization, password, and session helpers;
- Helmet and environment-specific response headers;
- TypeScript project references, real source includes, and aliases;
- validation and async-handler utilities;
- Excel utility behavior without a live import service.

`npm run test:integration` contains the three Moto-rate suites:

- `moto-rates-routes.test.ts` needs an application listening on
  `http://localhost:5000`;
- `moto-rates-storage.test.ts` needs PostgreSQL and mutates test fixtures;
- `moto-rates-authed.test.ts` needs PostgreSQL, a running application, seeded
  records, a Replit development domain, and admin credentials.

`npm test` deliberately continues to discover both groups for local
compatibility. It is not the CI command because it fails at collection or
connection time when those external prerequisites are absent. Integration
tests should move to a separate workflow only after it provisions an isolated
database and application process with disposable credentials and data.

## Known repository-wide gates

The workflow intentionally runs the existing repository-wide
`format:check` and `lint` commands. At this baseline they expose pre-existing
formatting and lint debt and may keep CI red; the workflow does not conceal
that state. Resolve those findings in scoped cleanup work rather than weakening
the commands.

The passing `npm run check` covers the three established library packages.
The honest whole-application baseline is `npm run check:all`; its known
diagnostics and cleanup order are recorded in
`docs/typescript-baseline.md`. Once that command reaches zero diagnostics, it
should replace the temporary package-only check in CI.
