# Program 2A Financial Flow Inventory

Evidence base: targeted searches in `server/routes.ts`, `server/storage.ts`, `shared/schema.ts`, and the named frontend triggers. This inventory records current behavior; it does not approve the behavior.

## Write and report flows

| # | Flow | API/service entry | Frontend trigger | Storage/service and tables | Transaction / debit / credit | Edit, delete, reversal, duplicate guard | Tests / risk |
|---:|---|---|---|---|---|---|---|
| 1 | Manual journal voucher | `POST /api/vouchers/journal` | `Vouchers.tsx` | route writes `vouchers`, `voucher_entries` | Header+entries in `db.transaction`; user-selected Dr/Cr | PATCH replaces entries; delete uses generic flow; number uses `Date.now()` | Characterized; employee sync is after commit |
| 2 | Payment | `POST /api/vouchers/payment-receipt` | `Vouchers.tsx`, `PaymentVoucherTab.tsx` | `vouchers`, `voucher_entries` | Debit selected destinations; credit payment account; transaction | PATCH replaces; generic delete; timestamp only | Characterized; account ownership and idempotency gaps |
| 3 | Receipt | same as payment | `Vouchers.tsx`, `ReceiptVoucherTab.tsx` | same | Debit payment account; credit selected sources; transaction | same | Characterized; same risks |
| 4 | Expense | represented as Payment to expense ledger; no dedicated route | voucher UI | same | Debit expense; credit cash/bank | payment edit/delete | No dedicated expense contract |
| 5 | Customer payment | no dedicated customer-payment posting route; customer receivable ledger can be selected | voucher/POS UI | voucher entries; separate `customer_balances` service exists | Depends on selected account | No automatic `customer_balances` synchronization proved | Absent as a cohesive flow |
| 6 | Supplier payment | payment route with `supplierId` leg | `Vouchers.tsx` | voucher entries and suppliers | Debit supplier, credit cash/bank | generic edit/delete | Supplier has no company ID |
| 7 | Employee payment | payment/transfer route with `employeeId` | voucher/payroll UI | voucher entries then `employees.current_balance` | Debit employee, credit cash/bank | sync after commit; generic delete | Partial atomicity |
| 8 | Payroll posting | deposit/bonus/withdraw/pay-worker endpoints | `Payroll.tsx` | employees, vouchers/entries depending endpoint | Flow-specific | No unified payroll-run service; `/api/payroll/runs` used by UI is absent | Multiple uncoordinated paths |
| 9 | Salary advance | `POST /api/salary-advances` | Payroll/ERP advance components | vouchers, entries, salary_advances | Debit employee; credit selected cash ledger; no transaction | Deductions update two tables; delete endpoint used by UI is absent | High partial-write risk |
| 10 | POS sale | `POST /api/pos/sales` | `POS.tsx` | vouchers, entries, inventory, sales_items | Debit cash/bank/receivable; credit SALES | Manual cleanup on error; timestamp number | No DB transaction |
| 11 | Edited POS sale | `PUT /api/vouchers/:id/sales`; PATCH variant also exists | POS, POSDaybook, VoucherEdit | voucher, entries, inventory, sales_items | Reverse old and apply new in transaction | Historical cost retained by line ID | Two overlapping edit routes |
| 12 | Deleted POS sale | `DELETE /api/vouchers/:id` | Daybook | inventory, sales_items, entries, voucher | Re-add stock then delete accounting in route transaction | No persistent reversal record/guard | Global employee helper can escape transaction |
| 13 | Purchase-order accounting | PO import, create-purchase-voucher | PO import/AddContainer | purchase_orders, po_line_items, vouchers, entries, containers/charges | Purchases debit; supplier credit | PO edit updates voucher; delete generic | Creation paths are not one uniform boundary |
| 14 | Container accounting | container purchase voucher and container sale route | AddContainer, container pages | containers, container_sales, vouchers, entries | Purchase: debit Purchases/credit supplier; sale: debit customer/credit commission revenue | Sale is transactional; purchase voucher is idempotent by existing PO link | Mixed safety |
| 15 | Offload accounting | `POST /api/containers/:id/offload`, `storage.offloadContainer` | `OffloadDialog.tsx` | inventory, vouchers/entries, charges, container_offloads, containers | Purchases/charges and offset accounts vary | reverse/update routes exist | Storage method is multi-table without a transaction |
| 16 | Stock-transfer accounting | `POST /api/stock-transfers`, storage create | stock-transfer pages/import | voucher, transfer header/items, inventory | Monetary total stored on items; inventory moved | edit transaction reverses/reapplies; generic delete reversal | Voucher is created separately from transfer transaction |
| 17 | Stock-adjustment accounting | `POST /api/stock-adjustments`, storage create | Vouchers | voucher, adjustment header/items, inventory | Production/consumption valuation | edit reverses/reapplies; generic delete | Voucher header separate from inventory transaction |
| 18 | Opening balances | ledger/stock/import APIs | Accounts, CombinedImportDialog | opening fields and stock items | No generated balanced opening voucher | Direct edits/import | Historical audit trail is weak |
| 19 | Customer opening balance | customer create/update | Customers/Service | customers opening fields; linked ledger optional | Stored field plus later ledger movements | Direct update | Duplicate source of truth |
| 20 | Supplier opening balance | supplier create/update | Suppliers | suppliers.opening_balance | Stored only | Direct update | Supplier is global, not company scoped |
| 21 | Employee opening balance | employee create/update | Payroll | opening_balance and current_balance | current initialized from opening | Later cache sync | Cache can drift |
| 22 | Cash opening balance | ledger account create/update | Accounts | ledger_accounts.opening_balance | Natural side stored | Direct edit | Ledger calculation authoritative |
| 23 | Bank opening balance | bank account create/update | Accounts | bank_accounts.opening_balance | Side stored | Direct edit | Bank and optional linked ledger can duplicate |
| 24 | Foreign-currency posting | UI submits currency/rate; PO/container/customer tables store currency | voucher/PO UI | voucher schema stores neither currency nor rate | Base entries only | Edit cannot retain original FX | Historical FX invariant cannot be met |
| 25 | Voucher edit | type-specific PATCH and `PUT .../with-entries` | Daybook, VoucherEdit, dialog | vouchers and entries; some stock/source tables | Several transaction implementations | Replace-in-place; no immutable revision | Employee sync often outside commit |
| 26 | Voucher deletion | `DELETE /api/vouchers/:id` | Daybook | reverses inventory then deletes children/header | route transaction | Hard delete, no reversal voucher | No duplicate-reversal record; helper escapes tx |
| 27 | Voucher reversal | no generic reversal-voucher endpoint | none | absent | absent | only destructive delete and container reverse-offload | Explicitly absent |
| 28 | Daybook aggregation | `GET /api/vouchers`, detail/offload routes | `Daybook.tsx`, `POSDaybook.tsx` | reads vouchers, entries, sources | Read only | Deleted vouchers disappear | Characterized from entry totals |
| 29 | Account balance aggregation | account balance/transaction routes | Accounts, Daybook | opening + voucher entries | Read only | cutoff varies by endpoint | Multiple duplicated implementations |
| 30 | Trial balance | no dedicated route or named implementation | none located | absent | absent | absent | Explicitly absent |
| 31 | Income statement | `/api/stats/income-statement`, net-profit endpoints | IncomeStatement, Analytics | ledger accounts + voucher entries and some inventory/source totals | Read only | date filters supported unevenly | Uses JS number arithmetic |
| 32 | Net position | no dedicated route | none located | absent | absent | absent | Explicitly absent; balance sheet/net-profit are not the named contract |
| 33 | Quick account transfer | `POST /api/accounts/transfer` | QuickTransferDialog | voucher + two entries | Debit destination; credit source; transaction | no edit-specific flow; timestamp only | Employee cache after commit |
| 34 | Quick account adjustment | `POST /api/accounts/adjust` | QuickAdjustDialog | voucher, entries, MANUAL_ADJ ledger | target natural side; opposite suspense | no edit-specific flow | suspense account creation precedes posting tx |
| 35 | Inter-company transfer | `POST /api/inter-company-transfers` | no trigger located | two vouchers, four entries, transfer record, optional new ledgers | both companies individually balanced | no transaction, no retry guard | High split-brain risk |
| 36 | Fiscal-period close | storage `closeFiscalPeriod` | FiscalPeriodTab | vouchers, entries, fiscal_period_closures, accounts | one transaction | unique closure link | Transactional; JS arithmetic before persistence |
| 37 | POS import | `/api/pos-import/import` | POSImport | vouchers, entries, inventory, sales_items | transaction | file-level duplicate guard not proved | Transactional batch |
| 38 | Stock-transfer import | import endpoints | StockTransferImport | voucher, transfer tables, inventory | transaction per import | timestamp/sequence voucher number | Transactional batch |
| 39 | Customer balance history | `addCustomerBalanceEntry` | container/service flows | customer_balances | PostgreSQL decimal running balance | append-only entries, no repair mode | Not consistently linked from all customer postings |

Financial write/report flow count: **39**. The required 32 are all represented; absent flows are called out explicitly.

## Balance source-of-truth map

| Balance type | Authoritative source | Cached/duplicated source | Synchronization | Repair mechanism | Drift risk |
|---|---|---|---|---|---|
| Ledger accounts | opening balance + posted voucher entries | repeated report calculations | computed on read | none | Medium: implementations duplicate sign/date rules |
| Customers | linked customer ledger opening + entries | `customer_balances` running history and customer opening field | only flows that call `addCustomerBalanceEntry` | none | High |
| Suppliers | supplier opening + direct supplier voucher entries | none | computed in unified ledger | none | High isolation risk because supplier is global |
| Employees | employee voucher entries plus opening | `employees.current_balance`, deposits/withdrawals totals | route helper mutates cache | initialization endpoint only, no read-only reconcile repair | High |
| Cash | cash ledger opening + voucher entries | dashboard selection | computed on read | none | Medium |
| Bank | bank opening + direct bank voucher entries | optional linked ledger | computed on read | none | High if both representations are posted |
| Inventory value | source movement history should be authoritative | `inventory.total_value` and average rate | each operational flow mutates cache | sales-report cost recalculation mutates data; excluded from audit | High |
| Payroll | employee entries, salary advances and deductions | employee current balance and advance remaining balance | multiple route-specific updates | none | High |

## Exchange-rate and date sources

- Voucher business dates come from request fields for journal, payment/receipt, salary advance, inter-company transfer, and optionally POS; POS defaults to server UTC date when omitted.
- PO currency is stored, but no historical exchange rate/base amount is stored.
- Container sale and customer-balance currency are stored without historical rate/base amount.
- The UI’s transaction-specific exchange rate is not represented in the voucher schema.
