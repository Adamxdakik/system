# Program 2A Edit, Delete, and Reversal Matrix

| Flow | Original writes | Edit strategy | Delete strategy | Reversal records | Balance/inventory updates | Transaction | Duplicate-reversal guard | Current defect / Program 2B recommendation |
|---|---|---|---|---|---|---|---|---|
| Manual journal | voucher, entries, employee cache where applicable | replace entries | hard-delete entries/header | none | reverse/apply employee cache | partial | row absence only | immutable revision/reversal voucher; tx-scoped cache |
| Payment/receipt | voucher, paired entries, employee cache | replace all entries | generic hard delete | none | cache reversed/reapplied | partial | row absence only | immutable correction and idempotent reversal |
| Quick transfer/adjust | voucher, two entries, possible cache | no dedicated edit | generic hard delete | none | cache helper | partial | row absence only | same |
| POS sale | voucher, entries, sales_items, inventory | two overlapping sales edit endpoints | generic delete restores inventory | none | edit reverses old then applies new | create unsafe; edit safe; delete partial | row absence only | one posting service; persisted reversal identity |
| PO accounting | PO, lines, voucher/entries, container totals/charges | recalculate and update linked voucher | generic voucher/PO deletion cascades manually | none | container totals and charge vouchers changed | mixed | voucher link for some create paths | one source aggregate; reversal from persisted facts |
| Container purchase voucher | voucher/entries linked from PO | via PO edit | delete voucher/PO | none | supplier/purchases entries | unsafe/mixed | existing voucher link is an idempotency check | acquire link inside transaction |
| Container sale | voucher/entries, container_sale, container status | no complete edit route located | no complete delete route located | none | customer receivable/revenue | safe create | unique company/container | add supported immutable reversal |
| Offload | inventory, vouchers/entries, charges, offload row, container | PATCH deletes/rebuilds portions | reverse-offload | no immutable reversal record | inventory and charge accounting | unsafe/mixed | current offload presence | one transaction; persist exact reversal facts |
| Stock transfer | voucher, transfer header/items, two inventory locations | reverse old then apply new | generic voucher delete reverses | none | weighted-average inventory | partial parent | row absence only | combine voucher and transfer; reversal ID |
| Stock adjustment | voucher, adjustment header/items, inventory | reverse old then apply new | generic voucher delete reverses | none | weighted-average inventory | partial parent | row absence only | combine voucher and adjustment |
| Employee payroll deposit/bonus/withdrawal | employee cache and/or voucher entries | no unified edit | route-specific/absent | none | current balance and totals | unsafe | none | payroll command ledger with idempotency |
| Worker payment | employee/voucher effects | no unified edit | absent | none | current balance | unsafe | none | payroll posting aggregate |
| Salary advance | voucher, two entries, advance | deductions append and decrement balance | UI calls an absent delete route | deduction rows only | remaining balance; no voucher for deduction proved | unsafe | fullyPaid flag only | transactional advance and deduction vouchers |
| Inter-company transfer | two vouchers, four entries, transfer row, possible ledgers | none | none | transfer row links vouchers | two company ledgers | unsafe | none | single transaction and shared idempotency key |
| Fiscal close | closing voucher/entries, closure record | no edit | no delete route located | closure record | account close entries | safe | unique closing voucher/closure check | retain immutable close/reopen workflow |
| Customer balance history | history row with running balance | append adjustment | no delete path | history rows | cached running balance | unsafe concurrency | none | serialize and link each row to posting source |
| Opening balances | entity fields/imported stock fields | overwrite field | entity delete/soft-delete | none | no balancing opening voucher | mixed | none | opening-balance voucher and locked migration process |
| Foreign currency | only source currency in limited tables; base voucher entries | UI may resubmit current rate | generic delete | none | no historical rate/base fields | unknown | none | persist original currency, amount, rate, base amount |

## Trace conclusions

- The system generally performs destructive replacement or hard deletion rather than recording an accounting reversal document.
- Inventory reversal is recomputed with current cached quantities/rates in several paths. It is not guaranteed to be the exact inverse of the original persisted value.
- Daybook/report visibility follows remaining vouchers; a hard-deleted transaction leaves no accounting audit trail.
- Linked payroll, customer history, and employee cache effects are not uniformly reversed.
- No generic duplicate-reversal key or reversal-of relationship exists.

## Program 2B order

1. Introduce a transaction-scoped posting/reversal service without changing formulas.
2. Persist immutable source identity and reversal-of identity.
3. Move exact historical values through reversal instead of recomputing.
4. Replace hard delete of posted financial records with void/reversal.
5. Add one-time reconciliation/repair planning only after read-only diagnostics are reviewed.
