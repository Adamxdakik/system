# Program 6 operations readiness

This runbook is the final operational gate for the stacked Program 3 through Program 6 release. It covers deployment prerequisites, environment configuration, release and rollback, production verification, incident triage, operator smoke tests, and the remaining open-risk register.

## 1. Release ownership and scope

Release only the reviewed stacked chain in order:

1. Program 3 — simplified daily interface
2. Program 4 — individual motorcycle records and lifecycle
3. Program 5 — bandwidth telemetry, optimized reads, and export safety
4. Program 6 — deterministic frontend build, resilience, accessibility, and operations

Do not deploy an intermediate commit that omits a lower program in the stack. Record the exact Git commit deployed and compare it with the reviewed PR head before starting the release.

## 2. Required environment and deployment configuration

The production service uses the repository `render.yaml` contract:

- build: `npm ci --include=dev && npm run build && npm run db:migrate`
- start: `npm start`
- health check: `/api/health/db`
- runtime: Node
- production mode: `NODE_ENV=production`

Required production variables:

- `DATABASE_URL` — PostgreSQL connection string used by the application, migrations, and session store
- `SESSION_SECRET` — long random value; production startup intentionally fails when it is absent
- `PORT` — supplied by the hosting platform; the application falls back to `5000` outside the platform

Supported deployment metadata:

- `RENDER_GIT_COMMIT` — supplied by Render and exposed through the application build-version header
- `BUILD_VERSION` — optional explicit build identifier when a platform commit value is unavailable

Optional operational control:

- `DISABLE_BANDWIDTH_TELEMETRY=true` — disables Program 5 process-local bandwidth collection without changing request handling

PostgreSQL development fallbacks (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, and `PGSSLMODE`) are supported by the server but should not replace the managed `DATABASE_URL` contract in production.

Never store secrets, production database URLs, customer data, or exported workbooks in the repository or CI artifacts.

## 3. Pre-release checklist

Complete every item before approving deployment:

- Confirm Programs 3 through 6 are based on the immediately preceding reviewed branch.
- Confirm both permanent CI jobs pass on the exact final Program 6 head.
- Confirm no temporary workflow, formatter, diagnostic route, or generated artifact remains.
- Confirm the migration chain and idempotent rerun pass against disposable PostgreSQL.
- Take or confirm a recent managed PostgreSQL backup or recovery point.
- Record the previous known-good production commit.
- Confirm the deployment operator can trigger a rollback to that commit.
- Confirm `/api/health` and `/api/health/db` are healthy before deployment.
- Confirm an Admin, a normal back-office user, and a POS test account are available.
- Confirm representative small, normal, and large export datasets are available.
- Confirm no unresolved legacy supplier-company assignment will be guessed or auto-filled.

## 4. Release procedure

1. Deploy the exact reviewed Program 6 commit through the normal Render pipeline.
2. Watch dependency installation, production build, and database migration output.
3. Stop the release if migration, build, or startup reports an error.
4. Confirm `/api/health/db` becomes healthy.
5. Read the `X-Build-Version` response header and confirm it matches the intended build identifier.
6. Open the login page in a fresh browser session and confirm the current hashed JavaScript and CSS assets load.
7. Complete the automated and operator checks in Sections 6 and 7.
8. Keep the release under observation through representative Admin and POS traffic.
9. Record all evidence in the release ticket or PR comment before final approval.

## 5. Rollback procedure

Rollback immediately when any of the following occurs:

- login or session persistence fails for valid users
- a migration leaves the application unable to start
- accounting, inventory valuation, stock movement, payroll, container reversal, or POS totals differ from the pre-release baseline
- repeated stale-chunk reloads occur after one guarded refresh
- exports produce invalid or empty files under normal limits
- the health endpoint remains unhealthy
- error rate, response size, response time, or memory usage shows a sustained material regression

Rollback steps:

1. Stop new operator activity when financial or stock integrity may be affected.
2. Record the failing build version, time, user role, route, and request ID.
3. Redeploy the previous known-good commit.
4. Do not reverse migrations blindly. Restore or repair the database only with a reviewed database-specific plan.
5. Verify `/api/health/db`, login, one read-only financial report, one stock inquiry, and one POS read-only workflow.
6. Reopen the release PR as blocked and attach the observed evidence.

Program 3 and Program 6 UI changes are code rollback candidates. Program 4 schema changes require forward-compatible remediation or a reviewed database restore rather than ad hoc down migrations.

## 6. Production technical verification

### Health, build, and caching

- `/api/health` returns the minimal application-health contract.
- `/api/health/db` confirms PostgreSQL connectivity.
- `X-Build-Version` is present and identifies the deployed build.
- `index.html` is not cached.
- hashed JavaScript and CSS assets use long-lived immutable caching.
- a browser left open across a deployment performs at most one automatic stale-chunk refresh and does not enter a reload loop.

### Program 5 bandwidth and heavy-read evidence

While representative daily work is occurring:

1. Sign in as Admin.
2. Request `/api/admin/bandwidth-report?limit=50`.
3. Record frequency, response bytes, duration, heavy-response counts, slow-request counts, and errors for the busiest routes.
4. Exercise `/api/accounts/all` and representative stock-item and location stock-history pages.
5. Confirm response shapes, opening balances, closing balances, and weighted inventory results match the prior production behavior.
6. Confirm the optimized routes reduce duplicate in-flight database work and do not create authorization differences.
7. Confirm telemetry keys contain normalized routes and no request bodies, response bodies, customer data, or identifiers beyond the approved bounded route form.

### Export and memory evidence

Run one small, one normal, and one large representative export:

- confirm each downloaded workbook is non-empty and opens successfully
- confirm worksheet, row, and populated-cell limits fail with a clear controlled message
- start duplicate browser exports and confirm only one generation proceeds
- exercise concurrent server exports and confirm bounded queueing rather than unbounded work
- confirm overload or timeout returns a controlled capacity response
- observe service memory after exports and confirm it returns toward the pre-export range

Do not use production customer data outside the approved production operator session.

## 7. Operator smoke-test matrix

Record pass/fail, role, browser, viewport, and build version for each test.

### Admin desktop

- Sign in and confirm the dashboard loads.
- Use Tab from the top of the page and activate **Skip to main content**.
- Open and close the sidebar using keyboard controls.
- Open page search with the visible control and with `Ctrl+K` or `Cmd+K`.
- Navigate to Stock & Parts, create or edit only a designated test record, and confirm advanced fields remain available.
- Open Accounts and a representative stock-history page; compare values to the pre-release baseline.
- Trigger a validation error and confirm the message is announced and associated with the invalid field.
- Sign out using the icon-only control and confirm it has an accessible name.

### Back-office workflow

- Open New Sale and confirm sale setup, line items, totals, drafts, completion actions, and edit/correction behavior remain available.
- Open purchase-order and shipment workflows and confirm freight, other charges, currency, and status fields remain editable.
- Open Motorcycles and confirm search, filters, lifecycle status, timeline, workshop links, and finalized-sale restrictions.
- Confirm no accounting posting, stock valuation, container costing, or authorization behavior changed.

### POS desktop and narrow mobile/tablet

- Sign in with a POS role.
- Confirm POS, Daybook, Location Inventory, and Stock Transfer navigation remains reachable.
- At a narrow viewport, horizontally scroll the POS section navigation without page overflow.
- Confirm the current POS section exposes active-page state.
- Complete a designated test sale or a non-posting preview according to the release environment policy.
- Confirm loading states are announced and the interface remains keyboard-operable.
- Sign out and sign back in.

### Connectivity and recovery

- Switch the browser offline and confirm the offline state is announced.
- Return online and confirm restored connectivity is announced once.
- Confirm routine heartbeat requests pause while offline or while the tab is hidden and resume when available.
- Simulate or use a controlled recoverable page error and confirm **Try Again** receives focus.
- Test a stale lazy-loaded chunk across a controlled deployment and confirm one guarded automatic reload, followed by a manual reload option if the problem persists.

### Screen reader

Using VoiceOver, NVDA, or another approved screen reader:

- confirm loading status, offline/online state, validation errors, and recoverable errors are announced
- confirm logout buttons, sidebar controls, page search, POS section navigation, and main-content region have meaningful names
- confirm decorative icons are not announced as duplicate content
- confirm focus remains visible and logical through Admin and POS shells

## 8. Incident triage

Capture these fields before changing the system:

- UTC timestamp and local timestamp
- deployed build version and Git commit
- affected company, role, and location without including unnecessary personal data
- page and API route
- request ID from the response or structured log
- expected result and actual result
- whether the issue reproduces in a fresh session
- whether it is isolated to one browser, user, company, or dataset
- health endpoint result
- recent deployment, migration, export, or connectivity event

Severity guidance:

- **SEV-1:** financial or stock corruption, broad login failure, database unavailable, or uncontrolled repeated posting
- **SEV-2:** major workflow unavailable, repeated 5xx responses, sustained memory pressure, or exports unavailable for all users
- **SEV-3:** limited role/page failure with a safe workaround
- **SEV-4:** cosmetic, accessibility, or documentation defect without data risk

For SEV-1, stop affected posting activity and begin rollback assessment immediately. Preserve evidence before restarting or redeploying.

## 9. Final open-risk register

| Risk | Current control | Release evidence required |
| --- | --- | --- |
| Legacy supplier rows with no unambiguous company | Fail-closed audit and no guessed assignment | Review unresolved audit output before production changes |
| Production route sizes and latency differ from test data | Bounded Admin bandwidth report and optimized route registration | Capture representative production report |
| Large exports can pressure memory | Workbook limits, browser duplicate guard, server concurrency gate and queue timeout | Small/normal/large export and memory-recovery evidence |
| Stale browser bundles after deployment | Non-cached HTML, immutable hashed assets, one guarded chunk reload | Controlled across-deployment browser test |
| Accessibility varies by browser and assistive technology | Shared semantic states, focus styles, labels, and static regression contracts | Admin/POS keyboard and screen-reader matrix |
| Program stack is not yet on `main` | Ordered stacked PRs and exact-head CI | Resolve branch conflicts and merge only with explicit approval |

## 10. Approval record

A release is ready for final approval only when the following evidence is attached:

- exact Program 6 head commit
- permanent CI run with both jobs passing
- current mergeability of every stacked PR
- Program 5 production bandwidth/export evidence
- Program 6 Admin/POS keyboard, mobile, screen-reader, connectivity, and recovery evidence
- previous known-good production commit and rollback owner
- explicit repository-owner approval

Until those items are recorded, keep every unmerged program PR in draft state.
