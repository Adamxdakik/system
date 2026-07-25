# Program 2A Accounting Invariants

Status: audit baseline only. These invariants describe required behavior; they do not assert that the current implementation satisfies it.

## Decimal convention

Money comparisons must use PostgreSQL `numeric` arithmetic or integer minor units. The audit test seam converts a decimal string to `bigint` cents. JavaScript floating-point equality, epsilon-based posting acceptance, and intermediate `number` arithmetic are not acceptable for a final Program 2B posting engine.

## A. Balanced posting

For every non-optional posted voucher:

`sum(debit_amount) = sum(credit_amount)`

The comparison is exact at the persisted two-decimal scale. Optional/draft vouchers must be excluded consistently from all posted-book reports.

## B. Minimum entry structure

A posted voucher must have at least two non-zero entries, at least one debit and one credit, no negative debit or credit, no entry with both sides positive, and no zero/zero entry unless a named source type explicitly documents that exception.

## C. Company isolation

The voucher, every referenced ledger/bank/fixed-asset/employee/customer, each location, inventory row, source document, and supporting-balance write must belong to the same company. The only exception is the explicit inter-company transfer flow, which must create independently balanced vouchers in both authorized companies within one atomic unit.

Suppliers currently have no `company_id`; this prevents the invariant from being proven for direct `voucher_entries.supplier_id` postings.

## D. Transaction-date integrity

`vouchers.voucher_date` must equal the selected business date and remain unchanged by edit, deletion, or retry unless the user explicitly edits it. Linked source dates (`container_sales.sale_date`, `salary_advances.advance_date`, offload date, and any future source date) must reconcile to it.

## E. Historical FX integrity

The posting must retain original currency, original foreign amount, original exchange rate, and original base-currency amount. A later company-rate change must not alter those values.

Current gap: the voucher and voucher-entry schemas have none of these historical FX columns. The UI submits `currency` and `exchangeRate`, but the voucher routes discard them.

## F. Atomicity

If any write fails, no voucher header, entry, cached balance, inventory movement, source link, or auxiliary record may remain. All database writes must use the same transaction client. A helper that uses global `db` from inside `db.transaction()` is outside that transaction.

## G. Reversal symmetry

A delete, void, or reversal must undo every original effect once, using the historical quantities, values, account references, dates, and FX values. Repeating the reversal must be rejected or be a no-op.

## H. Idempotency

The same request identity and business command must produce at most one posting. A timestamp-generated voucher number is uniqueness, not idempotency: a retry generates a different timestamp and a second posting.

## I. Supporting-balance consistency

- Ledger, bank, and cash balances: opening balance plus posted voucher-entry movements.
- Customers: linked ledger result is authoritative; `customer_balances` is a secondary history/cache that must reconcile.
- Suppliers: opening balance plus direct supplier voucher entries is currently derived; there is no cached current balance.
- Employees: voucher entries are authoritative; `employees.current_balance` is a cache and must reconcile.
- Inventory value: inventory rows are the operational cache; historical source and stock-movement records must reproduce it.
- Payroll: employee voucher entries plus salary-advance/deduction records must reconcile to the employee cache.

## J. Reporting consistency

For one company and cutoff date:

- account balances equal opening balances plus eligible voucher entries;
- trial-balance debit equals credit;
- daybook totals equal the included vouchers and entries;
- income statement includes only the documented income/expense classifications;
- net position uses the same cutoff, optional/deleted policy, sign convention, and source balances.

Current gap: no dedicated `/api/...trial-balance` or `/api/...net-position` route exists, so those two report contracts cannot be proved.

## Program 2B acceptance sequence

1. Reject invalid entry structure before any write.
2. Validate company ownership for every reference.
3. Resolve and lock request idempotency.
4. Persist header, entries, source record, inventory effects, and cached balances through one transaction client.
5. Commit once.
6. Reconcile exact minor-unit totals and expose a stable source reference.
