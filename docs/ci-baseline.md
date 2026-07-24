# CI and test baseline

GitHub Actions runs on pull requests and pushes to `main`, on Ubuntu with
Node.js 20 and full Git history. Every required step fails normally; the
workflow has no `continue-on-error`, fallback success command, database
credential, or production access.

The required checks are:

```sh
npm ci --include=dev
npm run format:changed
npm run lint:changed
npm run check
npm run check:all:baseline
npm run test:ci
npm run build
```

For a pull request, changed-file checks compare the PR base SHA with the PR
head SHA. For a push to `main`, they compare the event's previous SHA with the
new SHA. Generated, dependency, cache, build, uploaded-asset, and artifact
directories are excluded.

`format:changed` formats each applicable changed file in memory and fails when
Prettier would alter a line added by the change. `lint:changed` runs ESLint on
applicable changed source files and fails on every error or warning located on
an added line. This makes new debt blocking without claiming that untouched
lines in historically unformatted large files are clean.

`npm run check` remains the passing check for the three existing library
packages. `check:all:baseline` also runs the real `npm run check:all`, parses
its TypeScript output, and compares normalized `file + diagnostic code`
counts with `.ci/typescript-diagnostics-baseline.json`. It fails if a new
diagnostic kind appears, an existing count increases, a new affected file
appears, or TypeScript fails without parseable diagnostics. Equal or reduced
diagnostics pass. A zero-diagnostic TypeScript run also passes.

The baseline is intentionally committed and reviewable. It can be refreshed
locally only after an intentional improvement or approved baseline change:

```sh
node scripts/check-typescript-baseline.mjs --update
```

## Test classification

`npm run test:ci` is deterministic and requires neither PostgreSQL nor a
running application. It covers request safety, upload boundaries, Excel
fixtures, authentication and permission helpers, security headers,
TypeScript configuration, and shared validation utilities.

`npm run test:integration` contains the three Moto-rate suites. They require
some combination of a running application, PostgreSQL, seeded records, a
Replit development domain, and admin credentials. `npm test` continues to
discover both unit and integration suites for compatibility, so its
environment-dependent failures are reported separately rather than hidden.
