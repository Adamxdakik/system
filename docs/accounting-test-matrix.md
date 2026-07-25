# Accounting Test Matrix

Status meanings: **covered** is an automated assertion in this branch, **partial** covers the shared invariant but not every route variant, and **gap** is a merge-readiness blocker.

| Financial flow | Service or route | Core invariant | Unit | PostgreSQL integration | Report | Concurrency | Reversal | FX | Status |
|---|---|---|---|---|---|---|---|---|---|
| Manual journal | `VoucherPostingService` | balanced, exact, company-scoped, atomic | yes | yes | yes | duplicate | exact | yes | covered |
| Payment / receipt / expense | shared posting service and voucher routes | same atomic posting contract | yes | shared service | yes | duplicate | shared | yes | partial: route edit variants |
| Generic voucher reversal | `VoucherReversalService`, `POST /api/vouchers/:id/reverse` | exact opposite, linked, once-only | yes | yes | yes | yes | yes | yes | covered |
| POS create | `POST /api/pos/sales` | accounting, sale items, and inventory commit together | shared invariants | transaction fixture | shared | source key | shared | stored | partial: route-level failure injection |
| POS edit/delete | legacy POS routes | finalized history uses reverse/repost | no | no | no | no | no | no | **gap** |
| Inter-company transfer | `POST /api/inter-company-transfers` | both company vouchers and link commit together | shared invariants | constraint fixture | shared | idempotency | shared | n/a | partial |
| Salary advance/deduction | salary-advance routes | voucher, cache, source and deduction are atomic | shared invariants | rollback primitive | shared | idempotency | shared | n/a | partial |
| Employee supporting balance | posting service / sync helper | cache changes in posting transaction | yes | audit fixture | statement primitive | n/a | yes | n/a | covered for shared service |
| Customer running balance | `addCustomerBalanceEntry` | no concurrent lost update | invariant | yes | audit fixture | yes | adjustment | n/a | covered |
| Supplier identity | supplier routes and posting resolver | supplier belongs to selected company | company mismatch | audit fixture | audit fixture | n/a | shared | n/a | covered for newly assigned suppliers |
| Container offload | `storage.offloadContainer` | inventory, charges, vouchers and offload commit together | no | no | shared | no | legacy | source currency | partial: transaction added; failure injection gap |
| Foreign currency | posting/reversal services | stored foreign amount, rate and base amount remain immutable | yes | yes | yes | n/a | yes | yes | covered |
| Daybook | `financialAuditCore` | authoritative entry totals | yes | yes | yes | n/a | yes | yes | covered at calculation layer |
| Trial balance | `financialAuditCore` | debit equals credit | yes | yes | yes | n/a | yes | yes | covered at calculation layer |
| Income statement | `financialAuditCore` | income/expense use finalized ledger effects | yes | yes | yes | n/a | yes | yes | covered at calculation layer |
| Net position | `financialAuditCore` | no cached-balance double count | yes | yes | yes | n/a | yes | yes | covered at calculation layer |
| Audit diagnostic | `npm run audit:financial` | read-only detection of known mismatches | characterization | fixture | n/a | n/a | detects | detects | covered |
| Controlled repair | `npm run repair:financial` | dry-run, explicit category/token, deterministic and logged | manual fixture | yes | n/a | advisory lock | flag repair | refuses ambiguity | partial: automated role-boundary test gap |
| Payroll edit/reversal | legacy payroll routes | atomic, dated, idempotent, reversible | no | no | no | no | no | no | **gap** |
| Opening-balance import | legacy import routes | no partial batch or double count | no | audit only | partial | no | documented | n/a | **gap** |
| Stock transfer/adjustment parent accounting | legacy routes | inventory and parent voucher share one transaction | no | no | no | no | legacy | n/a | **gap** |

## Permanent commands

- `npm run test:accounting:unit` — shared posting, money, reversal and invariant tests.
- `npm run test:accounting:reports` — exact daybook, trial-balance, income-statement and net-position reconciliation.
- `npm run test:accounting:ci` — infrastructure-independent accounting suite.
- `npm run test:accounting:integration -- --confirm-disposable` — PostgreSQL rollback, uniqueness, reversal, concurrency and audit fixtures. `DATABASE_URL` must identify a localhost database whose name includes `test`, `disposable`, or `preview`.

The integration harness creates uniquely named fixtures and removes only those fixtures. It never truncates a database.
