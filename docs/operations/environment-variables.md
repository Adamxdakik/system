# Environment Variables and Secrets

This document is the operator-facing registry for environment variables referenced by the application, scripts, tests, and CI helpers. `environment-usage.json` records the exact source files that reference each variable, and CI verifies that the audit and this document do not drift from the codebase.

Never commit real credentials, production connection strings, session secrets, repair tokens, or third-party API keys.

## Production-required configuration

| Variable | Required | Purpose and operating rule |
| --- | --- | --- |
| `SESSION_SECRET` | Yes in production | Secret used to sign the `erp.session` cookie. Use a long random value of at least 32 bytes. Rotating it signs out all users. Never reuse a database or third-party API password. |
| `DATABASE_URL` | Yes, unless the complete `PG*` set is supplied | Preferred PostgreSQL connection string for the application, migrations, audits, and integration scripts. Use the managed database's internal URL when the app and database share a private network. |
| `PGHOST` | Alternative to `DATABASE_URL` | PostgreSQL host. Must be supplied together with `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE`. |
| `PGPORT` | Alternative to `DATABASE_URL` | PostgreSQL port, normally `5432`. |
| `PGUSER` | Alternative to `DATABASE_URL` | PostgreSQL login role. Use a dedicated application role rather than a superuser. |
| `PGPASSWORD` | Alternative to `DATABASE_URL` | Password for `PGUSER`. Store only in the deployment platform's secret manager. |
| `PGDATABASE` | Alternative to `DATABASE_URL` | PostgreSQL database name. |
| `PGSSLMODE` | Environment-dependent | Set to `require` for external managed PostgreSQL. Set to `disable` only for an intentionally local or private non-TLS database. The application otherwise enables SSL automatically for non-local hosts. |

The server refuses to start without database configuration. In production it also refuses to start without `SESSION_SECRET`.

## Platform and deployment variables

| Variable | Source | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Start command/platform | `npm start` sets this to `production`. It enables secure session cookies and production security behavior. |
| `PORT` | Hosting platform | HTTP port. The server defaults to `5000` and listens on `0.0.0.0`. |
| `BUILD_VERSION` | Optional operator override | Explicit deployment identifier returned by `/api/build-info` and the `X-Build-Version` response header. Prefer the exact Git commit SHA. |
| `RENDER_GIT_COMMIT` | Render-provided | Fallback deployment identifier when `BUILD_VERSION` is not supplied. The application uses the first eight characters. |
| `REPL_ID` | Replit-provided | Marks a Replit-hosted environment so session cookies are treated as secure. Do not invent this value outside Replit. |

`BUILD_VERSION` falls back to `RENDER_GIT_COMMIT`, then to a process-start timestamp. For reliable release verification, set `BUILD_VERSION` to the exact reviewed commit when the platform does not provide a commit identifier.

## Optional integrations

| Variable | Default | Purpose and failure behavior |
| --- | --- | --- |
| `GEMINI_API_KEY` | Empty | Enables Google Gemini-backed ERP chat features. Core ERP, accounting, inventory, and POS flows must remain usable without it. |
| `TRACKINGMORE_API_KEY` | Unset | Enables TrackingMore container or shipment lookups. Keep it server-side and rotate it if exposed. |

Do not block deployment of core ERP functionality solely because an optional integration key is absent. Verify the related feature separately when a key is configured.

## Bandwidth telemetry controls

The report is Admin-only at `GET /api/admin/bandwidth-report?limit=50`. Telemetry is process-local and resets on restart.

| Variable | Default | Allowed operating guidance |
| --- | ---: | --- |
| `DISABLE_BANDWIDTH_TELEMETRY` | `false` | Set to `true` only when collection must be disabled. No request bodies, response bodies, user IDs, company IDs, or query strings are collected. |
| `BANDWIDTH_TELEMETRY_MAX_ROUTES` | `250` | Maximum normalized routes retained in memory. Code bounds it between 10 and 2,000. |
| `BANDWIDTH_HEAVY_RESPONSE_BYTES` | `256000` | Heavy-response threshold in bytes. Default code value is 250 KiB. |
| `BANDWIDTH_SLOW_REQUEST_MILLIS` | `750` | Slow-request threshold in milliseconds. |
| `BANDWIDTH_TELEMETRY_WINDOW_MINUTES` | `5` | Rolling report window. Code bounds it between 1 and 60 minutes. |

## Export safety controls

| Variable | Default | Purpose |
| --- | ---: | --- |
| `EXPORT_MAX_WORKSHEETS` | `50` | Maximum worksheets per generated workbook. |
| `EXPORT_MAX_ROWS` | `250000` | Maximum total actual rows per workbook. |
| `EXPORT_MAX_CELLS` | `3000000` | Maximum populated cells per workbook. |
| `EXPORT_MAX_CONCURRENT` | `2` | Maximum server Excel exports serialized at the same time. |
| `EXPORT_MAX_QUEUE` | `8` | Maximum waiting server exports before new requests are rejected. |
| `EXPORT_QUEUE_TIMEOUT_MS` | `30000` | Maximum queue wait before a controlled capacity error. |

Change these only after measuring memory use with representative exports. Increasing limits without increasing available memory can cause process termination.

## Financial repair controls

These are not normal application settings. They are temporary, high-risk controls for the guarded financial repair CLI.

| Variable | Rule |
| --- | --- |
| `FINANCIAL_REPAIR_SECRET` | Required by the repair CLI and must contain at least 32 characters. It generates same-day, company-and-category-specific confirmation tokens. Keep it separate from `SESSION_SECRET`. |
| `ALLOW_FINANCIAL_REPAIR` | Apply mode requires the exact value `true`. Leave unset or `false` at all other times, and remove it immediately after an approved repair. |

Repairs must begin with a dry run, use an exact company ID and category list, capture the before/after JSON, and be executed only after a verified database backup. Never leave `ALLOW_FINANCIAL_REPAIR=true` in a long-lived service environment.

## CI, test, and build-tool variables

| Variable | Scope |
| --- | --- |
| `CHANGED_FILES_BASE` | CI helper input for pull-request changed-file checks. Set by `.github/workflows/ci.yml`. |
| `CHANGED_FILES_HEAD` | CI helper input for pull-request changed-file checks. Set by `.github/workflows/ci.yml`. |
| `CHANGED_FILES_RANGE` | CI helper input for push changed-file checks. Set by `.github/workflows/ci.yml`. |
| `TEST_BASE_URL` | Integration-test target URL. Not a production application setting. |
| `REPLIT_DEV_DOMAIN` | Test-only Replit domain input. Not a production application setting. |
| `DEV` | Vite's built-in `import.meta.env.DEV` flag. It is generated by the build tool and must not be manually configured. |

## Secret rotation

1. Record the variable name, owner, rotation reason, and exact deployment being changed.
2. Create the replacement secret in the platform secret manager; never paste it into source control or issue comments.
3. Deploy the exact reviewed commit with the replacement value.
4. Verify `/api/health`, `/api/build-info`, login, session persistence, and the affected integration.
5. Revoke the old credential after the replacement is confirmed.
6. For `SESSION_SECRET`, expect every existing session to become invalid.
7. For database credentials, verify both the application connection and the PostgreSQL-backed session store.
