# Incident Response Guide

This guide covers application incidents that affect availability, authentication, financial integrity, inventory integrity, frontend loading, bandwidth, or exports.

## Severity

| Severity | Definition | Initial response |
| --- | --- | --- |
| SEV-1 | Confirmed financial or inventory corruption, destructive mutation of finalized records, widespread outage, or unsafe writes | Stop affected writes immediately, assign one incident owner, preserve evidence, and prepare rollback or restore. |
| SEV-2 | Major workflow unavailable, repeated 5xx errors, authentication failure, database instability, or severe performance degradation | Assign an owner, contain the affected workflow, and decide correction versus rollback. |
| SEV-3 | Limited feature failure with a safe workaround, optional integration outage, isolated export capacity issue, or minor UI problem | Record, contain, and schedule a reviewed fix. |

## First ten minutes

1. Record the exact UTC time, deployed build version, environment, and reporter.
2. Request `/api/build-info`, `/api/health`, and `/api/health/db`.
3. Capture relevant request IDs, HTTP statuses, affected user roles, company, location, and workflow.
4. Determine whether writes are still safe.
5. Do not restart the process before capturing process-local bandwidth evidence when performance or API volume is involved.
6. Do not delete, edit, recalculate, or repair financial records to “test” the issue.
7. Assign one incident owner and one decision owner for rollback or restore.

## Evidence to preserve

- exact build version and commit SHA
- application and platform logs around the first failure
- request IDs returned by failed API responses
- health endpoint payloads
- Admin bandwidth report when relevant
- affected record IDs and before/after screenshots or exports
- database backup or snapshot identifiers
- migration output
- memory, CPU, restart, and deployment events
- user role, company, location, and selected transaction date

Do not include passwords, session cookies, database URLs, API keys, or full production dumps in issue comments.

## Database or health endpoint failure

### Signals

- `/api/health` or `/api/health/db` returns 503
- login times out or fails across users
- PostgreSQL connection errors appear in logs
- the service repeatedly restarts during startup

### Actions

1. Confirm the deployed service has either `DATABASE_URL` or the complete `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE` set.
2. Confirm `PGSSLMODE` matches the database network and TLS requirements.
3. Verify the database service is running and accepts connections from the application network.
4. Confirm the database has not reached connection, storage, or resource limits.
5. Confirm the latest migration completed successfully and was rerunnable.
6. If the failure began with the release and cannot be corrected safely, roll back the application.
7. Restore a database only after writes are stopped and the restore plan is approved.

### Do not

- disable TLS merely to bypass a certificate or connection issue
- run `db:push` against production as an emergency migration substitute
- delete the PostgreSQL session table to fix general login problems
- repeatedly restart without recording the original failure

## Authentication or session failure

### Signals

- users cannot sign in despite valid credentials
- sign-in succeeds but refresh immediately returns to login
- logout does not invalidate the session
- secure cookies are missing in production

### Actions

1. Confirm `SESSION_SECRET` is present and has not changed unexpectedly.
2. Confirm `NODE_ENV=production` and HTTPS termination is working.
3. Confirm the application trusts one reverse proxy hop and the platform forwards HTTPS correctly.
4. Verify the PostgreSQL-backed session store can connect and create or read its table.
5. Check `/api/auth/me` and preserve the returned request ID on failure.
6. Confirm the user is active and has at least one valid company-role assignment.
7. If `SESSION_SECRET` was intentionally rotated, communicate that all users must sign in again.

### Do not

- expose session cookies or the session secret in logs or screenshots
- weaken secure or HTTP-only cookie settings
- bypass authentication middleware to restore access

## Financial, payroll, stock, or container integrity incident

Treat unexpected balances, quantities, costs, reversals, or finalized-record mutations as SEV-1 until disproved.

### Actions

1. Stop writes in the affected workflow or company.
2. Record affected voucher, stock item, container, employee, account, company, and location IDs.
3. Capture the selected transaction date and current build version.
4. Run read-only audits before any repair:

```bash
npm run audit:financial -- --confirm-non-production --output json
npm run audit:supplier-companies -- --confirm-non-production --output json
```

For production, use equivalent read-only execution from an approved administrative environment and preserve the output securely.

5. Compare application totals with voucher entries and inventory movements.
6. Determine whether the issue is display-only, stale-cache, posting, reversal, migration, or historical-data related.
7. Prefer reversal and corrected reposting over destructive mutation.
8. Use the guarded repair CLI only with a verified backup, dry-run evidence, approval, same-day confirmation token, and temporary `ALLOW_FINANCIAL_REPAIR=true`.

### Do not

- directly edit finalized vouchers
- manually update balances without reconciling source entries
- leave repair mode enabled
- merge or deploy an unvalidated emergency fix

## Stale frontend chunks or blank application shell

### Signals

- “Failed to fetch dynamically imported module”
- “Loading chunk failed”
- a page works before deployment but fails after navigation
- users report a blank page after a release

### Actions

1. Confirm `/api/build-info` matches the intended release.
2. Confirm `index.html` is served with no-cache headers and hashed assets are immutable.
3. Ask the user to use the application’s reload action once.
4. Confirm the guarded stale-chunk recovery does not reload more than once per 60 seconds.
5. Verify the deployed static bundle and server bundle were built from the same commit.
6. Roll back if required assets are missing or the build is internally inconsistent.

### Do not

- disable browser caching for hashed assets globally
- instruct users to repeatedly refresh in a loop
- treat a mismatched server and client deployment as a user-device problem

## High bandwidth, slow API, or memory pressure

### Actions

1. Before restarting, request the Admin bandwidth report:

```text
GET /api/admin/bandwidth-report?limit=50
```

2. Record top routes by recent bytes, requests per minute, heavy responses, slow requests, error count, maximum response bytes, and maximum duration.
3. Check whether polling or repeated navigation is multiplying requests.
4. Inspect `/api/accounts/all`, stock-history routes, factory/daybook-style large endpoints, and export routes first.
5. Confirm response lengths are known and that compression or platform transfer accounting is understood.
6. Reduce traffic or temporarily disable a nonessential integration before increasing instance size.
7. Restart only after process-local evidence is captured.

### Important limitation

The report is process-local. It resets on restart and does not aggregate multiple instances.

## Export capacity or zero-byte file incident

### Signals

- `EXPORT_CAPACITY_EXCEEDED`
- export queue timeout
- zero-byte or unreadable workbook
- process memory rises and does not recover

### Actions

1. Confirm the export filters and expected row count.
2. Retry with a narrower date range or location filter.
3. Record active and queued export behavior.
4. Verify configured worksheet, row, cell, concurrency, queue, and timeout limits.
5. Run a small known-good export to distinguish data-specific failure from global export failure.
6. Confirm successful browser blobs and server buffers are non-empty.
7. Increase limits only after measuring peak memory and concurrency on the target instance.

### Do not

- remove workbook limits during an incident
- allow unlimited concurrent exports
- repeatedly submit the same large export while the queue is saturated

## Optional integration outage

For Gemini or TrackingMore failures:

1. Confirm the core ERP remains healthy.
2. Verify the relevant API key is configured and has not expired.
3. Check the third-party provider status and quota.
4. Rotate a compromised key through the platform secret manager.
5. Keep the optional feature contained; do not block accounting, inventory, POS, or authentication.

## Recovery verification

An incident is not resolved until:

- the exact recovered build version is recorded
- both health endpoints return 200
- authentication and session persistence work
- affected totals or quantities reconcile
- the original workflow succeeds using controlled verification data
- no repair-only environment variable remains enabled
- logs show no continuing error spike
- the incident record contains cause, impact, containment, corrective action, and prevention work

## Escalation and follow-up

Create follow-up work for every condition that required manual intervention, platform changes, a data repair, a rollback, or an undocumented command. Add permanent tests or documentation where possible. Do not close a SEV-1 incident until financial and inventory reconciliation is signed off by the responsible operator.
