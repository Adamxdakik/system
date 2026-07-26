# Program 5A — Production Bandwidth Verification

## Purpose

Program 5A adds production-safe measurement before any heavy endpoint is changed. It does not alter accounting, inventory, POS, voucher, container, payroll, motorcycle, workshop, or assembly behavior.

## Baseline found

The existing API request logger records request ID, method, path, status, duration, and `Content-Length` when that header exists. That is useful for individual requests, but it does not provide a rolling request-frequency view and can miss response size when the response is streamed, chunked, or does not expose a usable length header.

## Added verification

The server now records bounded, process-local API samples with:

- normalized route template and HTTP method
- request count and requests per minute
- measured response bytes
- average and maximum response size
- large-response count at or above 512 KiB
- server-error count
- average and maximum duration

The collector:

- keeps at most 10,000 samples
- retains at most 15 minutes
- excludes static assets
- excludes its own metrics endpoint
- never stores request bodies, response bodies, query values, user IDs, company IDs, session IDs, or authentication secrets
- resets on deployment or process restart

## Admin endpoint

`GET /api/admin/bandwidth-metrics?windowMinutes=15`

The endpoint requires an authenticated Admin role and sets `Cache-Control: no-store`.

Valid windows are positive numbers and are capped at the 15-minute retention period. The result ranks up to 50 routes by total response bytes, with request count used as the secondary ordering.

## Production verification procedure

1. Deploy the Program 5A branch to a safe preview or production candidate.
2. Allow representative user activity for at least 15 minutes.
3. As an Admin, request `/api/admin/bandwidth-metrics?windowMinutes=15`.
4. Review routes with the highest total response bytes.
5. Separately review routes with the highest request count or requests per minute.
6. Confirm whether the bandwidth driver is response size, repeated polling, or both.
7. Select Phase 5B endpoint changes only from measured evidence.

## Interpretation limits

The measurements are application response bytes observed by Node before any external reverse-proxy transformation. Render or another proxy may compress or add transport overhead. The data is intentionally process-local, so multi-instance totals must be reviewed per instance and samples disappear after a restart.

## Guardrail

Program 5A intentionally makes no pagination, caching, payload-shape, polling, query, or business-logic change. Those optimizations belong in a later measured phase.
