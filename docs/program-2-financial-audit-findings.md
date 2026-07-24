# Program 2A Financial Audit Findings

The classifications below require code or characterization-test evidence. No production data was inspected, so historical-data findings remain unverified.

## Confirmed defects

### High

#### H1 — POS sale creation is not atomic

- Flow: POS sale.
- Evidence: `server/routes.ts` creates voucher, entries, inventory updates, and sales items with global `db`; the catch block performs best-effort cleanup and swallows cleanup failures.
- Tables: vouchers, voucher_entries, inventory, sales_items.
- Symptom/impact: a mid-flow or cleanup failure can leave a partial sale or incorrect stock/value.
- Safe reproduction: mocked repository failure after the first inventory update; no shared DB required.
- Fix: one transaction-scoped posting service with row locks.
- Repair: run the read-only orphan/missing-accounting and inventory reconciliation first; repair design is Program 2B.
- Test: injected failure after every write.
- Scope: large.

#### H2 — Inter-company posting can split

- Flow: inter-company transfer.
- Evidence: two vouchers, four entries, and the transfer link are inserted sequentially with no `db.transaction`.
- Tables: ledger_accounts, vouchers, voucher_entries, inter_company_transfers.
- Symptom/impact: only one company may record the transfer.
- Safe reproduction: mock failure before the TO-company voucher insert.
- Fix: one transaction plus authorization for both companies and one idempotency key.
- Repair: identify unpaired `from_voucher_id`/`to_voucher_id`.
- Test: fail between sides and retry.
- Scope: medium.

#### H3 — Main offload posting is not atomic

- Flow: container offload.
- Evidence: `storage.offloadContainer` performs inventory, accounting, charge, container, and offload writes without `db.transaction`.
- Tables: inventory, vouchers, voucher_entries, container_charges, container_offloads, containers.
- Symptom/impact: partial offload accounting or inventory.
- Safe reproduction: mocked failure after a charge voucher or inventory row update.
- Fix: pass one transaction client through the entire offload service.
- Repair: diagnostic comparison of source/offload/voucher/inventory state.
- Test: failure injection at each write boundary.
- Scope: large.

#### H4 — Employee balance synchronization escapes enclosing transactions

- Flow: voucher create/edit/delete and quick account operations.
- Evidence: `syncEmployeeBalancesFromEntries` uses global `db`; it is invoked after commits and from within the voucher-delete transaction callback.
- Tables: employees, voucher_entries, vouchers.
- Symptom/impact: voucher and cached employee balance can disagree after failure; rollback does not roll back the cache update.
- Safe reproduction: mock employee update success followed by transaction failure.
- Fix: accept a transaction repository/client and lock employee rows.
- Repair: compare employee current balance with opening plus entries.
- Test: rollback and concurrency coverage.
- Scope: medium.

#### H5 — Salary advances and deductions are non-atomic

- Flow: salary advance.
- Evidence: voucher, debit entry, credit entry, and salary advance are sequential writes; deduction row and remaining-balance update are sequential.
- Tables: vouchers, voucher_entries, salary_advances, salary_advance_deductions.
- Symptom/impact: orphan voucher, one-legged voucher, advance without accounting, or deduction without balance change.
- Safe reproduction: mocked failure after each statement.
- Fix: transactional service and deduction accounting contract.
- Repair: link and compare advance/deduction/voucher records.
- Test: halfway failures and duplicate deduction.
- Scope: medium.

#### H6 — Historical FX data submitted by the UI is discarded

- Flow: foreign-currency journal/payment/stock operations.
- Evidence: UI sends `currency` and `exchangeRate`; vouchers and entries have no currency, foreign amount, exchange-rate, or base-amount columns and routes do not persist them.
- Tables: vouchers, voucher_entries; PO/container/customer source tables only store currency.
- Symptom/impact: historical rate cannot be reconstructed or protected from current-rate changes.
- Safe reproduction: submit non-USD voucher and read it back.
- Fix: Program 2B schema/design proposal with immutable historical FX fields.
- Repair: historical rates may require external source evidence; do not infer automatically.
- Test: rate preservation after company-rate change.
- Scope: large and migration-bearing.

#### H7 — Payment/receipt account ownership is not comprehensively validated

- Flow: manual payment/receipt.
- Evidence: the route maps request account IDs directly into voucher entries without calling the ownership checks used by quick transfer/POS.
- Tables: vouchers, voucher_entries, ledger_accounts, bank_accounts, employees; suppliers lack company ownership.
- Symptom/impact: a guessed cross-company account ID can be attached to another company’s voucher.
- Safe reproduction: disposable DB with two companies and a foreign ledger ID.
- Fix: central reference resolver requiring the current company.
- Repair: run cross-company entry diagnostic.
- Test: every account kind across two companies.
- Scope: medium.

### Medium

#### M1 — Timestamp voucher numbers do not provide idempotency

- Evidence: financial routes generate `...-${Date.now()}` and no request/source idempotency table or `Idempotency-Key` handling was found.
- Impact: retries/double-clicks create distinct postings.
- Fix/test: source-scoped unique idempotency record, concurrent duplicate tests.
- Scope: medium.

#### M2 — Customer running balance is concurrency-sensitive

- Evidence: `addCustomerBalanceEntry` reads the latest row then inserts the new balance without a row/advisory lock or unique sequence.
- Impact: concurrent entries can share one starting balance and lose a movement in the cached history.
- Fix/test: serialize by company/customer and compare to ledger.
- Scope: small/medium.

#### M3 — Supplier financial identity is not company scoped

- Evidence: `suppliers` has no `company_id`; direct supplier voucher entries therefore cannot prove tenant isolation.
- Impact: supplier opening and movements may be shared or ambiguously attributed.
- Fix/test: Program 2B data-model decision and migration plan; no audit-phase schema change.
- Scope: large/migration-bearing.

#### M4 — UI uses payroll/advance mutation routes that are absent

- Evidence: `ERPRunPayroll.tsx` calls `/api/payroll/runs`; payroll components call `DELETE /api/salary-advances/:id`; no matching server routes were found.
- Impact: intended edit/delete workflows fail or remain incomplete, so accounting cleanup behavior is undefined.
- Fix/test: decide whether to implement or remove each workflow in Program 2B, then characterize accounting effects.
- Scope: medium.

## Architectural risks

1. Multiple voucher creation/edit implementations duplicate validation, ownership, date, and balance behavior.
2. Posted vouchers are hard-deleted; there is no immutable reversal-of relationship.
3. Inventory reversals recompute weighted values rather than applying exact stored reversal facts.
4. Report routes duplicate floating-point account aggregation and account-type lists.
5. Trial-balance and net-position named contracts are absent.
6. Opening balances are mutable entity fields rather than an auditable balanced opening posting.
7. Bank balances may be represented both by direct bank entries and an optional linked ledger.

## Unverified suspicions

- Existing data may contain partial POS/offload/inter-company postings.
- Existing employee current balances may have drifted from voucher entries.
- Non-USD historical documents may have been posted with a rate that cannot now be recovered.
- Duplicate vouchers may exist with different timestamp voucher numbers but the same business source.
- Inventory value may not reverse symmetrically for previously edited/deleted operations.

These are not claimed as defects in stored data until the read-only diagnostic runs against an authorized disposable snapshot.

## Historical-data issues

None confirmed. Production and shared records were not queried.

## Counts

| Severity | Confirmed defects |
|---|---:|
| Critical | 0 |
| High | 7 |
| Medium | 4 |
| Low | 0 |
| **Total** | **11** |

## Program 2B implementation sequence

1. Add exact decimal/reference validation and transaction-scoped repositories.
2. Protect POS, offload, salary advance, and inter-company flows with atomicity tests.
3. Add idempotency before changing user-facing formulas.
4. Make employee/customer cache updates transaction-scoped and reconcilable.
5. Design immutable reversal and historical FX persistence with migrations reviewed separately.
6. Consolidate report calculations only after write-side invariants pass.
