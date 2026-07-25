# Program 2 Final Audit

## Scope and current decision

Program 2A established the accounting invariants and identified the highest-risk financial flows. Program 2B now provides exact-money posting, immutable correction and reversal services, company validation, historical FX controls, transaction boundaries, idempotency, diagnostics and controlled repair. Program 2C adds permanent invariant, report, migration and PostgreSQL concurrency coverage.

The pull request remains **draft** because four domain-level merge blockers remain under “Remaining risks.” No production database was queried or modified.

## Program 2A findings and current disposition

| Finding | Disposition |
|---|---|
| POS sale creation can partially commit | fixed: sale, entries, items and inventory use one transaction with row locks |
| Finalized POS edit/delete can rewrite history or restore the wrong value | fixed: correction is reverse-and-repost; cancellation restores persisted historical quantity and cost and recalculates average value exactly |
| Generic finalized voucher edits/deletes are destructive | fixed: payment, receipt and journal corrections use linked reversal and replacement; finalized direct mutations are blocked |
| Inter-company posting can split | fixed: paired vouchers, entries and transfer link share one transaction; both company permissions are checked |
| Main offload posting is non-atomic | fixed for creation: inventory, container status, charge accounts/vouchers and offload record use one transaction |
| Employee balance sync escapes transactions | fixed for shared posting/correction flows: exact SQL deltas run through the transaction executor |
| Salary advances/deductions are non-atomic | fixed: advance accounting, source record, cache and deduction boundaries are transactional and cancellation is linked to reversal |
| Historical FX is discarded or guessed | fixed for new postings; legacy unproven rows are marked `UNRESOLVED_LEGACY` and exact reversal is refused |
| Payment/receipt account ownership is incomplete | fixed through central company reference validation, including optional location ownership |
| Timestamp-generated numbers do not prevent duplicates | fixed through company-scoped idempotency/source uniqueness and stable fingerprints |
| Customer running balance loses concurrent movements | fixed with company/customer advisory locking and database-decimal updates |
| Supplier identity is not company-scoped | fixed for new/assigned suppliers; read-only evidence audit reports unresolved legacy rows without guessing |
| Empty-database migration chain is broken | fixed: early table-order dependencies are deferred safely and the full chain applies twice on disposable PostgreSQL |

## Services and data controls

- `server/services/accounting/money.ts`: scaled-integer parsing, normalization and FX conversion at declared precision.
- `server/services/accounting/voucherPostingService.ts`: entry invariants, balance, company references, source/idempotency fingerprints and transaction-scoped posting.
- `server/services/accounting/voucherReversalService.ts`: exact linked reversal and double-reversal prevention.
- `server/services/accounting/finalizedVoucherCorrectionService.ts`: atomic reversal plus corrected replacement.
- `server/services/accounting/posSaleCorrectionService.ts`: atomic POS correction/cancellation with exact inventory quantity/value restoration.
- `server/services/accounting/openingBalanceImportService.ts`: exact parsing, duplicate-file prevention, locks and all-or-nothing stock opening import.
- `server/services/accounting/salaryAdvanceService.ts`: transactional salary-advance creation, deduction and cancellation.
- `server/routes/finalizedFinancialMutationGuards.ts`: permits draft edits but blocks destructive mutation of finalized vouchers, entries, transfers and adjustments.
- `server/services/accounting/drizzleAccountingStore.ts`: PostgreSQL transaction adapter and supporting employee-cache synchronization.
- `scripts/audit-financial-integrity.ts`: read-only reconciliation.
- `scripts/audit-supplier-company-assignments.ts`: evidence-based supplier-company assignment report.
- `scripts/repair-financial-integrity.ts`: dry-run-first, category-scoped, token-gated deterministic repair with advisory lock and audit log.

No migration or repair invents a balancing entry, exchange rate, supplier company, or ambiguous historical amount.

## Program 2C coverage

The permanent CI now proves:

- changed-line formatting and lint;
- package and whole-application TypeScript baselines;
- CI-safe unit tests and production build;
- full migration chain from an empty PostgreSQL database;
- a second idempotent migration run;
- posting rollback, uniqueness, exact reversal, FX and concurrency fixtures;
- POS historical quantity/value restoration after average cost changes;
- daybook, trial balance, income statement and net-position reconciliation;
- read-only financial and supplier-company audits.

See `docs/accounting-test-matrix.md` for flow-level coverage and explicit partial areas.

## Remaining risks and merge blockers

1. **Legacy payroll operations:** employee deposits, bonuses, withdrawals and worker-payment routes still perform voucher, entry and employee-cache writes across separate statements. They need one transactional service with source idempotency and a confirmed cancellation/correction contract.
2. **Stock transfer/adjustment parent accounting:** domain rows and inventory mutations are transactional, and finalized direct edits are blocked, but the parent voucher is created outside the domain transaction. Historical rows also do not always preserve the actual inventory value removed, so an exact reversal cannot be fabricated safely.
3. **Container reverse-offload:** offload creation is transactional, but the legacy reversal route subtracts quantities with floating-point arithmetic and hard-deletes charge vouchers. It must be replaced by a linked immutable reversal that restores exact inventory value and charge/accounting state, or fail closed for legacy rows whose cost history is not provable.
4. **Legacy supplier ownership data:** suppliers with `company_id IS NULL` require reviewed evidence-based assignment before strict non-null enforcement or production deployment. Ambiguous rows must remain unresolved.

Additional non-blocking coverage work remains for dedicated route-level injected failures on POS create, opening imports and offload creation, plus controlled-repair role-boundary tests.

## Deployment checklist

1. Take a verified database backup and record the exact application commit.
2. Run `npm run audit:financial -- --company-id <id> --confirm-non-production` on a disposable recent snapshot.
3. Run `npm run audit:supplier-companies -- --confirm-non-production --output json`; review every unresolved supplier manually.
4. Apply the full migration chain to the disposable snapshot twice and confirm the second run is a no-op.
5. Run `npm run test:accounting:integration -- --confirm-disposable` and the full CI workflow.
6. Deploy to preview with non-production data and complete role, POS, voucher, payroll, statement, report, import, stock-movement and container smoke tests.
7. Apply production migrations in a maintenance window, deploy the exact reviewed commit, then run read-only health and reconciliation checks.
8. Keep the pull request draft until the four domain blockers are resolved and CI is green against current `main`.

## Rollback plan

Stop new writes, roll the application back to the recorded pre-deployment commit, and restore the verified database backup if migration or post-deploy reconciliation fails. Do not reverse the schema by dropping financial-integrity columns after new postings have used them. Preserve migration and repair audit logs, and reconcile any transaction accepted between deployment and rollback before reopening writes.
