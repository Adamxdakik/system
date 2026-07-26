# Release, Verification, and Rollback Runbook

Use this runbook for every production deployment. A release is complete only when the exact reviewed commit is deployed, database and application safeguards pass, and the post-deployment evidence is recorded.

## Required release record

Create one release record containing:

- exact Git commit SHA
- pull request numbers and merge order
- CI run ID and conclusions
- deployment platform and service name
- previous deployed build version
- database backup or snapshot identifier
- migration command and result
- deployment start and completion timestamps
- `/api/health`, `/api/health/db`, and `/api/build-info` results
- smoke-test operator
- rollback decision owner
- unresolved risks or deferred production evidence

Do not use branch names, PR titles, or “latest” as a deployment identifier. Record the exact commit SHA.

## Before merging

1. Confirm every stacked pull request is open, mergeable, and based on the intended predecessor.
2. Merge stacked work from the oldest base to the newest head. Never merge a child PR before its parent.
3. Rebase or retarget each remaining child PR after its parent lands.
4. Rerun permanent CI on the new exact head after every retarget or rebase.
5. Confirm formatting, zero-warning lint, package TypeScript, whole-application TypeScript baseline, CI-safe tests, production build, migrations, accounting integration, payroll, stock, container reversal, POS inventory value, reporting, and read-only audits are green.
6. Confirm no temporary workflow, diagnostic script, generated credential, production data export, or local artifact remains in the PR.
7. Confirm the environment-variable registry matches the target environment.
8. Obtain explicit release approval.

## Database backup

Take a verified backup immediately before a release that runs migrations or changes financial, inventory, payroll, container, or authentication behavior.

For a managed PostgreSQL service, prefer a provider snapshot with a recorded identifier. For a direct PostgreSQL backup, use a custom-format dump from a trusted administrative environment:

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file="erp-predeploy-<commit>.dump"
```

Verify that the file exists, is non-empty, and can be listed:

```bash
pg_restore --list "erp-predeploy-<commit>.dump" >/dev/null
```

A backup is not considered verified merely because the command exited successfully. Record its size, creation time, storage location, and restore owner. Never store a production dump in the repository.

## Build and migration sequence

Use the repository scripts rather than ad hoc commands:

```bash
npm ci --include=dev
npm run build
npm run db:migrate
npm run start
```

Operational rules:

- `npm run db:migrate` is the production migration command.
- Run migrations once per release against the intended production database.
- Do not use `npm run db:push` as a substitute for reviewed production migrations.
- The application requires `SESSION_SECRET` and database configuration in production.
- Set or record `BUILD_VERSION` as the exact reviewed commit when the platform does not expose a reliable commit identifier.
- Confirm the deployed process listens on the platform-provided `PORT`.

## Immediate post-deployment checks

Run these checks against the deployed service before allowing normal traffic to continue.

### 1. Build identity

```text
GET /api/build-info
```

Confirm the returned version matches the release record. Also confirm normal responses contain the same `X-Build-Version` value.

### 2. Application and database health

```text
GET /api/health
GET /api/health/db
```

Both must return HTTP 200 with database status `ok`. A 503 is a failed deployment, not a warning.

### 3. Authentication and sessions

- Sign in with a non-production test or approved operator account.
- Refresh the page and confirm the session persists.
- Sign out and confirm the session is invalidated.
- Confirm an expired or invalid session returns to sign-in without a blank application screen.
- Confirm the session cookie is secure, HTTP-only, same-site lax, and named `erp.session` in production.

### 4. Read-only business verification

Open and compare representative records from:

- Dashboard
- Accounts
- Transaction History or Daybook
- Stock & Parts
- Location Inventory
- Containers
- Motorcycles
- Customers or Service

Verify totals and response shapes against the pre-release evidence. Do not “correct” unexpected totals during smoke testing.

### 5. Controlled write verification

Using approved test data or a designated smoke-test company:

- create and reverse or remove one non-finalized test transaction according to the normal workflow
- confirm account and stock effects match expectations
- confirm finalized financial records remain protected by reversal rules
- confirm the action appears on the correct selected date
- remove or reverse the test data through supported application behavior

Do not run uncontrolled writes in a live financial company merely to prove the deployment works.

### 6. Frontend recovery

- Navigate between at least five lazy-loaded pages.
- Hard-refresh one nested route.
- Confirm loading indicators appear rather than a blank screen.
- Confirm a normal page error can be retried.
- Confirm a stale deployment chunk prompts or performs only one guarded application reload.

### 7. Bandwidth and heavy-read verification

While representative daily workflows are active, an Admin should request:

```text
GET /api/admin/bandwidth-report?limit=50
```

Record:

- `requestsPerMinute`
- `responseBytesPerMinute`
- `knownLengthPercent`
- `heavyResponseCount`
- `slowRequestCount`
- `errorCount`
- top routes by `responseBytesLastWindow`
- maximum response size and duration for `/api/accounts/all` and the optimized stock-history routes

Telemetry is process-local and resets on restart. Capture it before restarting or scaling the process.

### 8. Export verification

Run four representative Excel checks:

1. small export
2. normal daily export
3. large but valid filtered export
4. two or more concurrent exports

Confirm:

- each successful file is non-empty and opens correctly
- worksheet, row, and populated-cell limits produce clear capacity errors
- queue saturation is controlled rather than terminating the process
- browser downloads are not zero-byte or truncated
- memory and response latency return to normal after completion

## Release acceptance

A release may be accepted only when:

- exact build identity is confirmed
- both health endpoints are green
- login, session persistence, and logout work
- representative read-only totals match
- controlled write behavior is correct
- frontend navigation and recovery work
- bandwidth evidence is captured when required
- exports succeed within configured limits
- no new error spike appears in application logs
- the backup identifier and rollback owner are recorded

## Rollback triggers

Begin rollback when any of these conditions is confirmed and cannot be safely corrected immediately:

- `/api/health` or `/api/health/db` remains 503
- deployed build identity does not match the approved commit
- users cannot authenticate or sessions do not persist
- accounting, stock, payroll, POS, container, or motorcycle totals change unexpectedly
- finalized financial records can be destructively mutated
- repeated frontend reload loops occur
- API errors or latency make daily work unsafe
- export generation repeatedly terminates or destabilizes the process
- a migration is incomplete, non-idempotent, or incompatible with the deployed application

## Application rollback

1. Stop new deployments and announce the rollback owner.
2. Record the failing build version, first observed time, affected workflows, and request IDs.
3. If financial or inventory integrity may be affected, temporarily stop writes or place the service in maintenance mode at the platform layer.
4. Redeploy the last known-good exact commit.
5. Do not run additional migrations merely to make the old application start.
6. Verify `/api/build-info`, `/api/health`, `/api/health/db`, authentication, representative totals, and the affected workflow.
7. Keep the incident open until post-rollback reconciliation is complete.

## Database rollback

The repository does not provide a general automated down-migration command. Treat database rollback as one of these controlled choices:

1. deploy a forward-compatible application fix
2. apply a reviewed forward migration that repairs the schema
3. restore the verified pre-release backup into a controlled database and cut over according to the hosting provider's procedure

Never manually drop columns, tables, constraints, or financial rows during an incident without a reviewed repair plan and verified backup.

Before restoring a production database:

- stop application writes
- record the restore point and expected data-loss window
- confirm who approved the restore
- preserve the failed database for forensic comparison when possible
- restore into a separate database first when the platform permits
- rerun migrations only if the restored commit requires them
- run accounting, stock, payroll, container, and supplier-company audits before reopening writes

## Post-rollback verification

After rollback or restore:

- confirm the exact known-good build version
- confirm both health endpoints return 200
- reconcile transactions created during the failed release window
- run read-only financial and supplier-company audits
- compare account, stock, payroll, container, and POS totals to the pre-release record
- confirm no repair-only environment variables remain enabled
- document the root cause, corrective action, and prevention work before attempting another release

## Known operational limitations

- Bandwidth telemetry is process-local and is not a centralized historical monitoring system.
- Active-user presence is stored in memory and resets on process restart.
- The repository does not automate production database snapshots or restore drills.
- The repository does not provide universal down migrations.
- Optional Gemini and TrackingMore integrations require separate external availability checks.
- Large exports remain bounded by process memory and configured safety limits.
- Program 5 production bandwidth and export evidence must be captured from the actual deployed environment before final approval.
