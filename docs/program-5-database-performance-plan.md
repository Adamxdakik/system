# Program 5 — Database Hardening and Performance

## Goal

Measure production traffic safely, then optimize the routes and export workloads that create the most bandwidth, database, and memory pressure.

Program 5 must preserve accounting, inventory, POS, container, payroll, motorcycle, and authorization behaviour. Performance work may change how data is fetched or serialized, but it must not change business results.

## Phase order

1. **5A — Production bandwidth verification**
2. **5B — Heavy APIs and database queries**
3. **5C — Exports and memory**

## Phase 5A — Production bandwidth verification

### Completed scope

- collect process-local API request counts and response sizes
- normalize dynamic path identifiers so telemetry remains bounded
- retain a rolling request and response-byte window for current traffic
- identify heavy responses, slow requests, error counts, and unknown response lengths
- expose an Admin-only, no-cache report at `GET /api/admin/bandwidth-report`
- preserve the existing structured request log without recording response bodies
- add a hard route-cardinality limit with an overflow bucket
- allow telemetry to be disabled without changing endpoint behaviour

### Privacy and safety boundaries

The collector does **not** store:

- response bodies
- request bodies
- query strings
- user IDs
- company IDs
- customer, supplier, employee, or motorcycle data

No telemetry is written to PostgreSQL. The report is process-local and resets when the server restarts.

### Default thresholds

- heavy response: `256000` bytes
- slow request: `750` milliseconds
- rolling window: `5` minutes
- maximum route buckets: `250`

These can be adjusted with:

- `BANDWIDTH_HEAVY_RESPONSE_BYTES`
- `BANDWIDTH_SLOW_REQUEST_MILLIS`
- `BANDWIDTH_TELEMETRY_WINDOW_MINUTES`
- `BANDWIDTH_TELEMETRY_MAX_ROUTES`

Set `DISABLE_BANDWIDTH_TELEMETRY=true` to disable collection entirely.

### Production verification procedure

1. Deploy the exact reviewed commit to the intended environment.
2. Use the normal daily workflows that should be represented in the report.
3. As an Admin, request `/api/admin/bandwidth-report?limit=50`.
4. Review routes ordered by recent response bytes.
5. Record the highest recent byte rates, request rates, maximum response sizes, slow counts, and unknown-length counts.
6. Compare the measured routes with the static 5B audit and verify the optimized handlers cover the actual production hot paths.

### Acceptance

- API output and business calculations are unchanged.
- Dynamic IDs and query strings cannot create unbounded telemetry keys.
- The report is accessible only to authenticated Admin users.
- The report endpoint does not count itself.
- Route cardinality remains bounded.
- The collector can be disabled through an environment variable.

## Phase 5B — Heavy APIs and database queries

### Completed implementation

- generated a static heavy-route and client-refetch audit to supplement production telemetry
- replaced the supplier account balance N+1 query wave with grouped SQL aggregation
- registered optimized handlers before the legacy monolithic routes for:
  - `GET /api/accounts/all`
  - `GET /api/stock-items/:id/vouchers/:year/:month`
  - `GET /api/locations/:locationId/stock-items/:stockItemId/vouchers/:year/:month`
- used parallel independent queries, grouped aggregates, and batch location-name loading
- replaced `EXTRACT`-style monthly filtering with index-friendly half-open date windows
- coalesced identical in-flight reads so simultaneous callers share one database workload
- preserved weighted-average stock history, opening and closing balances, route permissions, and response shapes
- added calculation and registration guardrail tests

### Remaining deployment evidence

The implementation is complete, but acceptance still requires traffic from the deployed reviewed commit. Collect the Admin bandwidth report during representative daily use and confirm that the optimized routes show lower latency and resource pressure without response-shape or total differences.

## Phase 5C — Exports and memory

### Completed implementation

- generated a static export and memory audit across server and browser call sites
- added workbook capacity checks before serialization on both server and browser paths
- default workbook limits:
  - `50` worksheets
  - `250000` rows
  - `3000000` populated cells
- serialized server Excel files through a bounded concurrency gate
- default server export concurrency:
  - `2` active exports
  - `8` queued exports
  - `30000` millisecond queue timeout
- rejected excess queued work with a clear capacity error instead of allowing uncontrolled memory growth
- rejected zero-byte server buffers and browser blobs
- prevented duplicate simultaneous browser Excel generation
- delayed browser object-URL revocation so downloads are not truncated or saved as empty files
- preserved the existing Excel compatibility API and all existing export call sites
- added tests for workbook metrics, limits, queueing, overload rejection, and non-empty serialization

### Configuration

Server workbook and concurrency limits can be adjusted with:

- `EXPORT_MAX_WORKSHEETS`
- `EXPORT_MAX_ROWS`
- `EXPORT_MAX_CELLS`
- `EXPORT_MAX_CONCURRENT`
- `EXPORT_MAX_QUEUE`
- `EXPORT_QUEUE_TIMEOUT_MS`

### Remaining deployment evidence

Run representative small, normal, and large exports from the reviewed deployment. Confirm that valid files open correctly, excessive exports fail clearly, concurrent exports remain bounded, and server memory returns to its normal range after generation.

## Final acceptance

- formatting and changed-line lint pass with zero warnings
- package and whole-application TypeScript checks pass
- CI-safe unit tests and production build pass
- the full PostgreSQL migration chain remains idempotent
- permanent accounting, payroll, stock movement, container offload reversal, POS inventory value, report reconciliation, and read-only audits remain green
- no temporary workflows remain in the branch
- production bandwidth and representative export evidence are recorded before merge
