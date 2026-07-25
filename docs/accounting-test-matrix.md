# Accounting Test Matrix

Status meanings: **covered** is enforced by automated assertions in this branch, **partial** means the safe service/policy exists but a legacy domain variant or route-level failure fixture remains, and **gap** is a merge-readiness blocker.

| Financial flow | Service or route | Core invariant | Unit | PostgreSQL integration | Report | Concurrency | Reversal | FX | Status |
|---|---|---|---|---|---|---|---|---|---|
| Manual journal | `VoucherPostingService` | balanced, exact, company-scoped, atomic | yes | yes | yes | duplicate | exact | yes | covered |
| Finalized payment / receipt / journal correction | `FinalizedVoucherCorrectionService`, correction routes | immutable reverse-and-repost in one transaction | yes | shared posting/reversal | yes | idempotency | exact | stored | covered |
| Generic voucher reversal | `VoucherReversalService`, `POST /api/vouchers/:id/reverse` | exact opposite, linked, once-only | yes | yes | yes | yes | yes | yes | covered |
| POS create | `POST /api/pos/sales` | accounting, sale items and inventory commit together | shared invariants | transaction fixture | shared | source key | shared | stored | partial: route-level injected-failure fixture remains |
| POS edit / cancel | `PosSaleCorrectionService`, correction routes | finalized sale uses reverse-and-repost; cancellation restores exact persisted quantity and cost | yes | yes, including changed-average value regression | shared | idempotency | exact | stored | covered |
| Direct finalized mutation | `finalizedFinancialMutationGuards` | drafts remain editable; finalized voucher/domain rows cannot be destructively changed | yes | route policy | n/a | n/a | required | n/a | covered |
| Inter-company transfer | `POST /api/inter-company-transfers` | both company vouchers and transfer link commit together | shared invariants | constraint fixture | shared | idempotency | shared | n/a | partial: dedicated reversal fixture remains |
| Salary advance / deduction | `SalaryAdvanceService`, salary-advance routes | voucher, cache, advance and deduction share one transaction | service coverage | rollback primitive | shared | idempotency | cancellation reversal | n/a | covered for salary advances |
| Payroll deposit / bonus / withdrawal / worker payment | `PayrollPostingService`, transactional payroll routes | voucher, entries, employee cache and payroll totals commit together; retries are idempotent and insufficient withdrawals roll back | shared posting rules | dedicated deposit/retry/withdrawal/rollback fixture | shared | source and idempotency keys | generic immutable voucher correction | base currency | covered |
| Employee supporting balance | posting service / sync helper | cache changes in posting transaction | yes | audit fixture | statement primitive | n/a | yes | n/a | covered for shared service |
| Customer running balance | `addCustomerBalanceEntry` | no concurrent lost update | invariant | yes | audit fixture | yes | adjustment | n/a | covered |
| Supplier identity | supplier routes, posting resolver and supplier-company audit | supplier belongs to selected company; ambiguity is never guessed | company mismatch | audit fixture | audit fixture | n/a | shared | n/a | partial: unresolved legacy null assignments require reviewed data mapping |
| Opening-balance import | `OpeningBalanceImportService`, stock opening route | exact parsing, row locks, duplicate-file protection and all-or-nothing import | service validation | migration/schema path | partial | advisory/row locks | documented correction | n/a | partial: dedicated end-to-end failure-injection fixture remains |
| Stock transfer creation | `storage.createStockTransfer` plus finalized guards | transfer rows and inventory mutations share a transaction; finalized direct edits are blocked | no domain unit | transaction primitive | n/a | row locks | legacy exact reversal unavailable | n/a | **gap**: parent voucher is created outside the inventory transaction and old records do not preserve actual source value |
| Stock adjustment creation | `storage.createStockAdjustment` plus finalized guards | adjustment rows and inventory mutations share a transaction; finalized direct edits are blocked | no domain unit | transaction primitive | n/a | row locks | legacy exact reversal unavailable | n/a | **gap**: parent voucher is created outside the inventory transaction and consumption history may not preserve actual removed value |
| Container offload creation | `storage.offloadContainer` | inventory, charges, vouchers, status and offload record commit together | no | migration/integration environment | shared | source uniqueness | legacy route unsafe | source currency | partial: creation atomic; route-level failure injection remains |
| Container reverse-offload | legacy `POST /api/containers/:id/reverse-offload` | exact immutable reversal of inventory value, charges and linked vouchers | no | no | no | no | destructive delete | incomplete | **gap** |
| Foreign currency | posting/reversal services | stored foreign amount, rate and base amount remain immutable | yes | yes | yes | n/a | yes | yes | covered |
| Daybook | `financialAuditCore` | authoritative entry totals | yes | yes | yes | n/a | yes | yes | covered at calculation layer |
| Trial balance | `financialAuditCore` | debit equals credit | yes | yes | yes | n/a | yes | yes | covered at calculation layer |
| Income statement | `financialAuditCore` | income/expense use authoritative ledger effects | yes | yes | yes | n/a | yes | yes | covered at calculation layer |
| Net position | `financialAuditCore` | no cached-balance double count | yes | yes | yes | n/a | yes | yes | covered at calculation layer |
| Audit diagnostic | `npm run audit:financial` | read-only detection of known mismatches | characterization | fixture | n/a | n/a | detects | detects | covered |
| Supplier-company diagnostic | `npm run audit:supplier-companies` | evidence-based assignment candidates; ambiguous rows remain unresolved | validation | disposable DB | n/a | n/a | n/a | n/a | covered |
| Controlled repair | `npm run repair:financial` | dry-run, explicit category/token, deterministic and logged | manual fixture | yes | n/a | advisory lock | flag repair | refuses ambiguity | partial: automated role-boundary test remains |

## Permanent commands

- `npm run test:accounting:unit` — shared posting, money, immutable correction, reversal and policy tests.
- `npm run test:accounting:reports` — exact daybook, trial-balance, income-statement and net-position reconciliation.
- `npm run test:accounting:ci` — infrastructure-independent accounting suite.
- `npm run test:accounting:integration -- --confirm-disposable` — PostgreSQL rollback, uniqueness, reversal, concurrency and audit fixtures. `DATABASE_URL` must identify a localhost database whose name includes `test`, `disposable`, or `preview`.
- `npx tsx --tsconfig tsconfig.integration-tests.json server/__tests__/payrollPosting.postgres.ts --confirm-disposable` — transactional payroll deposit, retry, withdrawal, balance-cache and rollback assertions.
- `npx vitest run server/__tests__/posInventoryValue.test.ts` — exact persisted POS inventory quantity/value restoration; CI runs this inside the disposable PostgreSQL job.

The integration harness creates uniquely named fixtures and removes only those fixtures. It never truncates a database.
