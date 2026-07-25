# Program 2A Transaction Boundaries

Classification:

- **SAFE**: every write for the named operation uses one database transaction client.
- **PARTIAL**: an important write, cache sync, source creation, or parent operation is outside the transaction.
- **UNSAFE**: a multi-table financial operation has no database transaction.
- **UNKNOWN**: the named cohesive flow is absent or evidence is insufficient.

| # | Flow | Class | Inside transaction | Outside transaction / failure exposure |
|---:|---|---|---|---|
| 1 | Manual journal | PARTIAL | voucher header and entries | employee cache sync after commit |
| 2 | Payment | PARTIAL | voucher header and entries | employee cache sync after commit |
| 3 | Receipt | PARTIAL | voucher header and entries | employee cache sync after commit |
| 4 | Expense-as-payment | PARTIAL | same as payment | same |
| 5 | Customer payment | UNKNOWN | no cohesive route | customer history is not proved to follow arbitrary receivable postings |
| 6 | Supplier payment | PARTIAL | voucher and entries | supplier company ownership cannot be validated |
| 7 | Employee payment | PARTIAL | voucher and entries | `employees.current_balance` sync uses global `db` after commit |
| 8 | Payroll posting | UNSAFE | none common | route-specific employee/voucher writes are not one boundary |
| 9 | Salary advance/deduction | UNSAFE | none | voucher, two entries and advance record; deduction insert then balance update |
| 10 | POS sale create | UNSAFE | none | voucher, entries, inventory and sales items use best-effort cleanup |
| 11 | POS sale edit | SAFE | old reversal, new inventory/items/entries, voucher update | no external call inside transaction |
| 12 | POS sale delete | PARTIAL | inventory reversal and deletes | employee sync helper invoked inside callback but uses global `db` |
| 13 | PO accounting | PARTIAL | portions of import/edit | container/source lookups and some creation paths use storage/global DB |
| 14 | Container accounting | PARTIAL | container sale is complete | purchase-voucher/account setup paths are outside or non-transactional |
| 15 | Offload accounting | UNSAFE | reverse/update have local transactions | `storage.offloadContainer` performs the main multi-table posting without one |
| 16 | Stock transfer create | PARTIAL | transfer header/items and inventory | voucher header is created by a separate request/write |
| 17 | Stock adjustment create | PARTIAL | adjustment header/items and inventory | voucher header is separate |
| 18 | Opening-balance import/update | UNSAFE | no encompassing batch transaction proved | partial field updates can survive an import failure |
| 19 | Customer opening balance | PARTIAL | customer create may create linked data | duplicated customer/ledger opening values are not synchronized atomically |
| 20 | Supplier opening balance | SAFE | single-row supplier write | semantic isolation remains unprovable |
| 21 | Employee opening balance | PARTIAL | employee row write | opening/current duplicated values and later cache paths |
| 22 | Cash opening balance | SAFE | single ledger row write | none for the named operation |
| 23 | Bank opening balance | SAFE | single bank row write | linked-ledger relationship can duplicate balances but is a separate operation |
| 24 | Foreign-currency posting | UNKNOWN | no historical FX persistence | invariant cannot be mapped |
| 25 | Voucher edit | PARTIAL | type-specific header/entry replacement | employee cache reversal/apply frequently occurs after commit |
| 26 | Voucher deletion | PARTIAL | route-level inventory reversal and hard deletes | global employee helper is outside the callback transaction |
| 27 | Generic voucher reversal | UNKNOWN | absent | only destructive deletion exists |
| 28 | Daybook aggregation | SAFE | read only | no writes |
| 29 | Account aggregation | SAFE | read only | no writes |
| 30 | Trial balance | UNKNOWN | absent | no named implementation |
| 31 | Income statement | SAFE | read only | arithmetic consistency is a separate precision risk |
| 32 | Net position | UNKNOWN | absent | no named implementation |
| 33 | Quick transfer | PARTIAL | voucher and two legs | employee cache update after commit |
| 34 | Quick adjustment | PARTIAL | voucher and two legs | suspense ledger may be created before transaction; employee sync after |
| 35 | Inter-company transfer | UNSAFE | none | two company vouchers, four entries and link record can split |
| 36 | Fiscal-period close | SAFE | closing entries, voucher, closure record | no external call |
| 37 | POS import | SAFE | imported sale batch writes use transaction | no external call located |
| 38 | Stock-transfer import | SAFE | voucher, transfer records and inventory use transaction | no external call located |
| 39 | Customer balance running history | UNSAFE | none | reads latest balance then inserts; concurrent writers can use the same starting value |

## Counts

| SAFE | PARTIAL | UNSAFE | UNKNOWN | Total |
|---:|---:|---:|---:|---:|
| 10 | 17 | 7 | 5 | 39 |

## Confirmed boundary defects

1. `POST /api/pos/sales` performs a sequence of global-DB writes and tries compensating deletes/updates on failure. Cleanup failures are swallowed.
2. `POST /api/inter-company-transfers` creates the two sides sequentially with no transaction.
3. `POST /api/salary-advances` and deduction posting are sequential multi-table writes.
4. `storage.offloadContainer` writes inventory, accounting, charge, and offload state without `db.transaction`.
5. `syncEmployeeBalancesFromEntries` always uses global `db`. Calling it from a transaction callback does not enlist it in that transaction.
6. `addCustomerBalanceEntry` calculates from the latest row without locking or serializing the customer/company stream.

## External calls and after-commit work

No network service call was located inside a financial database transaction. Storage lookups invoked from transaction callbacks can use global `db`, which is still a boundary leak even though it is not an external network API. Employee balance synchronization is the principal post-commit financial write.

## Program 2B boundary plan

Pass a transaction-scoped repository object into every helper, combine voucher/source/inventory/cache writes, add row locks or a serialization key for balance streams, and make idempotency acquisition the first write in the transaction.
