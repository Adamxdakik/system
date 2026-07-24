# Program 1 final validation record

This document records the correction run after rebasing PR #1 onto current
`Adamxdakik/system:main`. Command results and the production browser smoke
test are filled from the final validation run before the branch is published.

## Permission verification matrix

| Case | Expected result | Focused verification |
| --- | --- | --- |
| Admin | Every feature key, `fullAccess: true` | Unit test |
| Owner with stored rows | Enabled Owner rows only | Unit test |
| Manager with stored rows | Enabled Manager rows only | Unit test |
| POS1 through POS6 | Enabled rows intersected with POS-safe features | Parameterized unit test |
| Owner/Manager without rows | Compatibility fallback, excluding Settings | Parameterized unit test |
| POS role without rows | POS-safe fallback only | Unit test |
| User without company access | HTTP 403, `NO_COMPANY_ACCESS`, request ID | Isolated Express test |
| Stored disabled permission | Omitted | Unit tests |
| Company switching | Session company/role fields are the source for permission lookup | Handler and session tests |
| Direct API access | Existing backend authentication/role middleware remains authoritative | Isolated role tests |
| Sidebar visibility | Existing `/api/my-permissions` role rows and fallback behavior retained | Source/behavior review |

`updateUserSchema` accepts every current user-management field:
`username`, `active`, `chatbotEnabled`, and `employeeInventoryAccess`, while a
provided replacement password must contain at least 10 characters.

Historical short passwords remain valid at login, valid legacy SHA-256 hashes
are migrated to bcrypt, session regeneration preserves authenticated company
and POS context, logout destroys the session and clears `erp.session`, and
login-history write failures do not block successful authentication.

## Results

The branch was rebased without a merge commit onto upstream main `09513d7`.
The only conflict was the redesigned Settings user form; current main was
preserved and blank-password-on-edit compatibility was reapplied manually.

| Validation | Result |
| --- | --- |
| `npm ci --include=dev` in a clean copy with `NODE_ENV=production` | Passed; 829 packages installed. Audit reported 19 existing dependency findings (2 low, 10 moderate, 6 high, 1 critical). |
| `npm run format:check` | Existing baseline failure: 463 files, dominated by generated/artifact and legacy source trees. Program 1 uses the changed-line formatting gate in CI. |
| `npm run lint` | Existing baseline failure: 229 findings (2 errors, 227 warnings). Focused lint on Program 1 implementation/test scripts passes with zero warnings. |
| `npm run check` | Passed. |
| `npm run check:all` / baseline guard | The raw check remains non-zero with 367 documented diagnostics. The guard passed at 367 with no new affected file, code, or increased count. |
| `npm run test:ci` | Passed: 7 files and 72 tests. |
| `npm test` | Existing environment failure: 71 tests passed and 6 server-dependent route tests failed because no app listens on port 5000; two PostgreSQL suites cannot collect without database configuration. |
| `npm run build` | Passed. Existing PostCSS source-map and chunk-size warnings remain. |
| Clean Render install + build | `NODE_ENV=production npm ci --include=dev && npm run build` passed in an isolated copy. |
| Exact Render chain | Install and build passed. Migration was attempted against a new disposable PostgreSQL cluster only; the clean-database migration-chain blocker is documented below. `render.yaml` retains the required order: install dev dependencies, build, then migrate. |

## Final error compatibility correction

Known errors below HTTP 500 return only `message`, `requestId`, `code`,
`requiresConfirmation`, `employeeBalance`, and `ledgerBalance` when those
properties are present. The focused HTTP safety suite proves that the
confirmation and balance properties and `code` survive a known 409 response,
while `query`, `params`, `sql`, `stack`, `password`, `passwordHash`,
`connectionString`, raw database details, and arbitrary nested data do not.
The same suite injects all of those properties into an unexpected error and
proves that the 500 response remains exactly:

```json
{
  "message": "Internal Server Error",
  "requestId": "failure-test"
}
```

Focused result: `server/__tests__/httpSafety.test.ts` passed all 17 tests.

## Production-only dependency audit

`npm audit --omit=dev` initially reported nine findings: one low, four
moderate, and four high. Comparison with `origin/main` confirmed that every
affected version was already present before Program 1. No automatic audit fix
or major-version upgrade was used.

| Package | Severity | Dependency | Runtime classification | Non-breaking upgrade | Program 1 result | Pre-existing |
| --- | --- | --- | --- | --- | --- | --- |
| `body-parser` 1.20.5 | Low | Transitive through Express | Loaded by Express, but the advisory requires an invalid limit configuration; the application uses fixed valid `2mb` limits | 1.20.6 exists, but Express 4.22.2 still pins 1.20.5; resolving it would require an override or upstream Express change | Retained with explicit-limit mitigation | Yes |
| `brace-expansion` 1.1.14 / 2.1.0 | High | Transitive through ExcelJS archive/glob packages | Installed in runtime dependencies; the application does not pass user-controlled glob patterns to the affected expansion path | 1.1.16 / 2.1.2 patch releases | Updated transitively to 1.1.16 / 2.1.2 | Yes |
| `exceljs` 4.4.0 | Moderate | Direct | Used for runtime XLSX imports and downloads; its reported finding is inherited from `uuid` | No non-breaking fixed ExcelJS release; npm proposes 3.4.0 and marks that change breaking | Retained; vulnerable UUID functions are not used | Yes |
| `express` 4.22.1 | Moderate | Direct | Core runtime HTTP server; the inherited `qs.stringify` advisory path is not used for request parsing | 4.22.2 | Updated to 4.22.2 | Yes |
| `multer` 2.1.1 | High | Direct | Used on all five runtime multipart import routes; vulnerable upload paths are reachable | 2.2.0 | Updated to 2.2.0; upload tests and preview import/rejection checks passed | Yes |
| `qs` 6.15.1 | Moderate | Transitive through Express/body-parser | Request parsing is used, but the advisory affects `qs.stringify` with a specific option combination that the application does not call | 6.15.3 | Updated transitively to 6.15.3 | Yes |
| `tmp` 0.2.5 | High | Transitive through ExcelJS | The affected prefix/postfix path is in ExcelJS's streaming reader; application imports use in-memory `Workbook.xlsx.load` | 0.2.7 | Updated transitively to 0.2.7 | Yes |
| `uuid` 8.3.2 | Moderate | Transitive through ExcelJS | ExcelJS calls UUID v4; the advisory affects v3/v5/v6 when a caller supplies a buffer | No compatible fixed release within ExcelJS's `^8.3.0`; fixed UUID is 11.1.1+ | Retained with unreachable vulnerable-function classification | Yes |
| `ws` 8.18.0 | High | Direct and transitive through `@google/genai` | No application source directly creates a WebSocket, but it is installed in the production graph | 8.21.1 | Updated to 8.21.1 | Yes |

The final `npm audit --omit=dev` result is three findings: one low
(`body-parser`) and two moderate (`exceljs` and its transitive `uuid`). There
are no remaining high or critical production-only findings. The residual
findings have no demonstrated reachable vulnerable call path in this
application, and no non-breaking parent-package update resolves them.

## Isolated preview smoke test

The preview ran on localhost against a newly initialized PostgreSQL 18 cluster
on port 55432 and a dedicated `program1_preview` database. It contained only
generated development fixtures. No production host, credentials, or records
were used.

| Preview check | Exact result |
| --- | --- |
| Admin login and logout | Login HTTP 200 with authenticated `Admin` role; logout HTTP 200; old session then returned 401 |
| Manager login and logout | Login HTTP 200 with authenticated `Manager` role; logout HTTP 200; old session then returned 401 |
| POS login and logout | Login HTTP 200 with authenticated `POS1` role; logout HTTP 200; old session then returned 401 |
| Company switching | Accessible-company list HTTP 200; switch to `OTHER` HTTP 200; switch back to `MAIN` HTTP 200 |
| Settings user edit with blank password | The Settings behavior omitted the blank password; PATCH HTTP 200; login with the unchanged existing password remained HTTP 200 |
| Representative CSV import | Moto-rate CSV HTTP 200; one rate and one percentage row applied to preview fixtures |
| Representative XLSX parse import | POS XLSX parse HTTP 200; one row parsed; total value 50 |
| File over 10 MB | HTTP 413 with `Request payload too large` and request ID `preview-over-limit` |
| Excel download | PO template HTTP 200; 6,967 bytes; attachment disposition present |
| Dashboard assets | Document HTTP 200; hashed JavaScript and CSS assets both HTTP 200 |
| Browser and CSP | Admin dashboard rendered in the in-app browser; no error/warning console entries and no CSP messages |

The browser pass used the production `securityHeaders("production")`
middleware. The dashboard, company label, role label, charts, navigation, and
logo rendered successfully without broadening CSP.

### Preview environment blocker found

Running `npm run db:migrate` against a completely blank disposable database
applied migration `0000` but stopped at
`0001_add_container_sales_unique_constraint` because `container_sales` did
not yet exist. The preview was therefore built by applying the current Drizzle
schema to a fresh second disposable database, then seeding it. This did not
touch production and did not change repository schema or migrations. A future
migration-baseline correction is required before a brand-new database can be
created using the SQL migration chain alone.
