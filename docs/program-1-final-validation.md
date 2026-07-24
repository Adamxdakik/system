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
| `npm run test:ci` | Passed: 7 files and 71 tests. |
| `npm test` | Existing environment failure: 71 tests passed and 6 server-dependent route tests failed because no app listens on port 5000; two PostgreSQL suites cannot collect without database configuration. |
| `npm run build` | Passed. Existing PostCSS source-map and chunk-size warnings remain. |
| Clean Render install + build | `NODE_ENV=production npm ci --include=dev && npm run build` passed in an isolated copy. |
| Exact Render chain | Migration execution was not performed locally because no disposable PostgreSQL database was available and the migration mutates its target. `render.yaml` retains the required order: install dev dependencies, build, then migrate. |

## Production security-header smoke test

The production bundle was served locally through the real
`securityHeaders("production")` middleware. HTTP smoke checks passed for the
root document, `/login`, the hashed JavaScript and CSS bundles, and an
attachment download. CSP contained only the configured self/data/blob and
Google Fonts sources, and HSTS was present. The focused development-header
test confirms Replit-compatible WebSocket sources and no HSTS outside
production.

The actual browser controller could not connect because Windows denied access
while initializing its browser runtime. Therefore interactive login,
authenticated dashboard/API behavior, rendered logos/fonts, download clicks,
and browser-console CSP inspection are recorded as environment-blocked, not
as passed. No CSP source was broadened in response.
