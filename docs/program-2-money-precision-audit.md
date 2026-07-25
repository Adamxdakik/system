# Program 2A Money Precision Audit

Targeted search over financial server paths and primary financial UI paths found **1,426 candidate uses** of `parseFloat`, `Number`, `toFixed`, `Math.abs`, or related number operations. Many are display-only. The table below consolidates the confirmed persistence/reporting risk groups; it is not a claim that all 1,426 candidates are defects.

| # | File / function | Monetary field | Current arithmetic | Required precision | Risk | Program 2B recommendation |
|---:|---|---|---|---|---|---|
| 1 | `server/routes.ts`, voucher with entries | debit/credit totals | `parseFloat` reduce + `Math.abs(diff) >= .01` | exact 2dp | one-cent tolerance and binary rounding | decimal/minor-unit validator before transaction |
| 2 | payment/receipt routes | entry and voucher totals | JS sum + `toFixed(2)` | exact 2dp | accumulated rounding | decimal library or SQL numeric aggregation |
| 3 | journal routes | debit/credit totals | JS numbers and epsilon | exact 2dp | balance decision is floating point | integer cents |
| 4 | quick transfer/adjust | amount | `Number` + `toFixed(2)` | exact 2dp | accepts excess scale then rounds | parse canonical decimal string, reject excess scale |
| 5 | POS create/edit | sales, cost, profit | quantity/rate number multiplication | quantity 3dp, money 2dp | extended-price and profit rounding differences | decimal quantity × money with named rounding |
| 6 | POS delete/reversal | inventory value | JS multiplication/division | quantity 3dp, value/rate 2dp | reversal may not reproduce historical value | reverse persisted historical values, not recomputation |
| 7 | `storage.offloadContainer` | charges and allocated cost | extensive `parseFloat`/division | money 2dp; quantity 3dp | allocation residuals and non-symmetric reversal | decimal allocation with explicit residual assignment |
| 8 | stock transfer/adjust create/edit | total value and weighted average | JS multiplication/division + repeated `toFixed` | quantity 3dp, rate/value 2dp | repeated rounding drift | higher-precision internal rate and exact final rounding |
| 9 | purchase-order edit | line and grand totals | JS sums/products | money 2dp, quantity 3dp | voucher/container totals can diverge | one decimal calculation service and stored line totals |
| 10 | salary advance deduction | remaining balance | `parseFloat`, subtraction, `<= .01` | exact 2dp | early fully-paid classification | exact cents and zero equality |
| 11 | employee cache sync | `currentBalance` | `parseFloat` then add/subtract | exact 2dp | cache drift and lost update | SQL numeric increment under row lock |
| 12 | income/net-profit/balance reports | account totals | repeated JS number aggregation | exact 2dp | report-to-ledger differences at scale | aggregate numeric values in SQL, stringify at API boundary |
| 13 | fiscal close | income/expense/net income | JS aggregation and `toFixed` | exact 2dp | closing entry can differ from source totals | calculate and post in SQL numeric transaction |
| 14 | customer running history | balance | PostgreSQL numeric expression | exact 2dp | arithmetic is safe but concurrency is not | retain SQL numeric; serialize latest-row update |
| 15 | frontend FX conversion | displayed/base amounts | JS numbers | documented FX scale (at least 6dp) | rate and foreign amount are not persisted | store original amount/rate/base amount as decimals |

## Equality findings

- Posting routes use `Math.abs(debits - credits) >= 0.01`.
- PO change detection uses `> 0.001`.
- Salary deduction uses `newRemainingBalance <= 0.01`.
- These are policy-bearing comparisons on binary floating-point values, not formatting-only operations.

## Safe existing pattern

`storage.addCustomerBalanceEntry` performs the balance expression in PostgreSQL decimal arithmetic. Its arithmetic type is appropriate; the missing row lock/serialization is a transaction concern, not a precision concern.

## Test seam

`server/financialAuditCore.ts` parses money strings to `bigint` minor units, rejects non-zero excess scale, and provides exact voucher/report fixture aggregation. It is audit-only and is not wired into production posting behavior.
