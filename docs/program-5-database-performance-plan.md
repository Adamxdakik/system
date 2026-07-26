# Program 5 — Database Hardening and Performance

## Goal

Measure production traffic safely, then optimize the routes and export workloads that create the most bandwidth, database, and memory pressure.

Program 5 must preserve accounting, inventory, POS, container, payroll, motorcycle, and authorization behaviour. Performance work may change how data is fetched or streamed, but it must not change business results.

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
6. Carry only evidence-backed heavy routes into Phase 5B.

### Acceptance

- API output and business calculations are unchanged.
- Dynamic IDs and query strings cannot create unbounded telemetry keys.
- The report is accessible only to authenticated Admin users.
- The report endpoint does not count itself.
- Route cardinality remains bounded.
- The collector can be disabled through an environment variable.
- Formatting, lint, TypeScript, tests, production build, migrations, and permanent financial and stock regressions remain green.

## Phase 5B — Heavy APIs and database queries

Use the Phase 5A report to optimize only verified heavy or frequently repeated APIs. Prefer field-limited selectors, SQL aggregation, pagination, stable caching, and removal of unnecessary refetch loops while preserving totals and permissions.

## Phase 5C — Exports and memory

Audit large Excel/PDF exports and memory-intensive transformations. Prefer bounded result sets, streaming or incremental generation where supported, controlled concurrency, and explicit failure handling without producing empty or corrupt files.
