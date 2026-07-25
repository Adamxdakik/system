# Program 2 Final Audit

## Scope and current decision

Program 2A established the accounting invariants and confirmed eleven defects. Program 2B implements the shared exact-money posting and reversal core, transaction-boundary corrections, company validation, historical FX storage, uniqueness constraints, diagnostics and controlled repair. Program 2C adds permanent invariant, report and PostgreSQL concurrency coverage.

The pull request must remain **draft** until the merge blockers under “Remaining risks” are resolved or explicitly accepted. No production database was queried or modified.

## Program 2A findings and Program 2B disposition

| Finding | Disposition |
|---|---|
| H1 POS sale creation can partially commit | fixed: sale, entries, items and inventory now use one transaction with inventory row locks |
| H2 inter-company posting can split | fixed: paired vouchers, four entries and transfer link share one transaction; both company permissions are checked |
| H3 main offload posting is non-atomic | fixed: the mutation phase for inventory, container status, charge accounts/vouchers and offload record uses one transaction |
| H4 employee balance sync escapes transactions | fixed for corrected flows: helper accepts the transaction executor and uses exact SQL deltas |
| H5 salary advances/deductions are non-atomic | fixed: advance accounting/source/cache and deduction/update boundaries are transactional |
| H6 historical FX is discarded | fixed for new postings: voucher and entry currency, rate, foreign amount and base amount are persisted and reversed exactly |
| H7 payment/receipt ownership is incomplete | fixed through the central company reference resolver, including optional location ownership |
| M1 timestamp numbers do not prevent duplicates | fixed through company-scoped idempotency/source uniqueness and stable fingerprints |
| M2 customer running balance loses concurrent movements | fixed with a company/customer transaction advisory lock and database-decimal update |
| M3 supplier identity is not company-scoped | fixed for new/assigned suppliers with `company_id` and route/service validation; legacy null rows require manual assignment |
| M4 UI references absent payroll/advance mutations | deferred: the intended payroll deletion/reversal policy is not documented, so inventing a route would change business behavior |

## Services and data controls

- `server/services/accounting/money.ts`: scaled-integer parsing, normalization and FX conversion at declared precision.
- `server/services/accounting/voucherPostingService.ts`: entry invariants, balance, reference validation, fingerprinting and transaction-scoped posting.
- `server/services/accounting/voucherReversalService.ts`: exact linked reversal and double-reversal prevention.
- `server/services/accounting/drizzleAccountingStore.ts`: production PostgreSQL transaction adapter and supporting employee-cache synchronization.
- `migrations/0013_financial_integrity.sql`: pre-audit, historical columns, company/source/idempotency/reversal uniqueness and entry-shape/FX constraints.
- `scripts/audit-financial-integrity.ts`: read-only reconciliation.
- `scripts/repair-financial-integrity.ts`: dry-run-first, category-scoped, token-gated deterministic repair with advisory lock and audit log.

No migration or repair invents a balancing entry, an exchange rate, or an ambiguous historical amount. Legacy suppliers without a provable company and legacy foreign-currency entries without a provable rate are reported for manual resolution.

## Program 2C coverage

The reusable fixture and invariant modules live under `server/test/accounting/`. Unit tests prove exact money, entry structure, balanced multi-entry journals, rollback, company rejection, idempotency, business dates, supporting employee balances, exact reversal and stored FX. Report tests reconcile daybook, trial balance, income statement and net position from authoritative entries. The PostgreSQL harness proves rollback, uniqueness, exact reversal metadata, audit detection, bounded concurrent duplicate/reversal protection and serialized customer balance updates.

See `docs/accounting-test-matrix.md` for flow-level coverage and explicit gaps.

## Remaining risks and merge blockers

1. Finalized POS edit/delete still follows legacy transactional replacement/hard-delete behavior rather than consistently using reverse-and-repost.
2. Generic payment/receipt/journal edit and delete variants have not all been migrated from destructive replacement to immutable correction.
3. Payroll edit/reversal semantics and the UI-referenced mutation routes have no confirmed business contract.
4. Opening-balance imports do not yet have end-to-end atomic/idempotent accounting tests.
5. Stock-transfer and stock-adjustment parent voucher creation is not proven to share the inventory transaction in every legacy route.
6. Container offload now has a single transaction, but route-level injected-failure and exact-reversal fixtures are still required.
7. The repository’s migration chain cannot initialize an empty database: `0004_add_bale_products.sql` references `production_bales` before that relation exists. Migration `0013` is independently idempotent, but full empty-schema migration readiness is blocked by this pre-existing chain defect.
8. Legacy suppliers with `company_id IS NULL` need evidence-based company assignment before the column can be made non-null.

These gaps must not be hidden by weakening tests or rewriting historical records.

## Deployment checklist

1. Take a verified database backup and record the current application commit.
2. Run `npm run audit:financial -- --company-id <id> --confirm-non-production` first on a disposable recent snapshot.
3. Resolve every migration pre-audit failure manually; do not run an automatic audit fix.
4. Apply the full migration chain to the disposable snapshot twice and confirm the second run is a no-op.
5. Run `npm run test:accounting:integration -- --confirm-disposable` against that snapshot.
6. Deploy to preview with non-production data and complete the role, POS, voucher, statement, report and import smoke matrix.
7. Apply production migrations in a maintenance window, deploy the exact reviewed commit, then run read-only health and reconciliation checks.
8. Keep the pull request draft until all required CI jobs and preview checks are visibly successful.

## Rollback plan

Stop new writes, roll the application back to the recorded pre-deployment commit, and restore the verified database backup if the migration or post-deploy reconciliation fails. Do not reverse the schema by dropping financial-integrity columns after new postings have used them. Preserve migration and repair audit logs, and reconcile any transaction accepted between deployment and rollback before reopening writes.
