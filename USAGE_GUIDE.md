# MotoTrack ERP/POS — Usage Guide

This guide walks you through every page in MotoTrack and how to use it.

> **Login**: open the app, enter your username and password, then pick the company you want to work in from the company switcher in the top-left header. Switching company changes what data every screen shows.
> **Roles**: `Admin` and `Owner` see everything. `Manager` is the day-to-day back-office role. `POS1`–`POS6` are limited to Sales / POS Daybook / Vouchers / Location Inventory.

---

## Top header (always visible)
- **Company switcher** (top-left): pick which tenant you're working in. Every page filters by this.
- **Notification bell** (top-right): rate-change alerts for managers. Click → "Mark all read" to clear.
- **User menu** (top-right): switch user role within the current company, log out.

---

## Dashboard (`/`)
Landing page after login.
- Tiles for total stock value, receivables, payables, cash, recent vouchers.
- Click any tile → drills into the underlying report.

## POS (`/pos`)
Point-of-sale screen for in-store sales.
1. Pick a **Location** at the top (your active store).
2. Type/scan a barcode or search by item name. Hit Enter to add a row.
3. Adjust **Qty** and **Rate** per row. Subtotal updates live.
4. Pick **Payment Account** (Cash / Bank). Toggle **Credit Sale** if billing to a customer (then pick the customer).
5. Click **Save Sale** → invoice prints automatically. Inventory + ledger update in real time.
- To edit a past sale: open POS Daybook → click the voucher → "Edit".

## POS Daybook (`/pos-daybook`)
Day-by-day list of POS sales.
- Date picker switches the day.
- Click a row to view; "Edit" reopens the sale in POS for corrections.

## Vouchers (`/vouchers`)
General-purpose Receipt / Payment voucher entry (back-office).
- Tabs: **Receipt** (money in) and **Payment** (money out).
- Pick the cash / bank account, then add line entries (account + amount).
- "Optional" toggle = saved but excluded from totals (use for parked entries).
- "Save" posts the voucher and updates all balances.

## Create (`/create`)
Quick voucher creator with templates (Sales, Purchase, Journal, Payment, Receipt, Stock Transfer, Production, Consumption). Pick the type, fill the form, save.

## Daybook (`/daybook`)
Full day's transactions across all voucher types.
- Date picker selects day.
- Toggle **Show automatic entries** (off by default) to also see Sales, Purchase, Stock Transfer, Closing, Production, Consumption — these are auto-generated from POS / inventory operations.
- Use the **Adjust Balance** button (header) for one-line journal corrections.
- Use the **Pay / Receive** button (header) for quick transfers between accounts.

## Accounts (`/accounts`)
Chart of accounts + balances. Columns: code, name, type (Asset/Liability/Equity/Income/Expense), balance.
- Search filters live.
- Click an account → opens its monthly ledger.
- "Create Account" adds a new ledger account; "Adjust Balance" / "Pay / Receive" buttons in the header (same as Daybook).

## Suppliers (`/suppliers`)
List of suppliers. Edit pencil → opens the supplier's profile (edit name, terms, address). Suppliers are global across companies.

## Containers (`/containers`)
Imported-goods containers (one container = one shipment from a supplier).
- "New Container" button → enter container #, supplier, freight, fumigation, etc.
- Click a container → details + offload screen (assigns items to stock).

## Stock Items (`/stock-items`)
Master list of products you sell.
- "Import" button uploads from Excel.
- Edit pencil → change name, code, UoM, opening qty, opening rate, selling price, group, and per-location stock targets.

## Stock Query (`/stock-query`)
Look up live quantity-on-hand for any item across every location. Click an item to see month-by-month movement.

## Stock Item History (`/stock-items/:id/history`)
Per-item monthly movement (in / out / closing) for the selected item.

## Location Inventory (`/location-inventory`)
Pick a location → see every item's qty + rate at that store.

## Location Summary (`/location-summary`)
Side-by-side qty matrix of every item × every location. Useful for stock-transfer planning.

## Location Insights (`/location-insights`)
Per-location KPIs (top sellers, dead stock, reorder candidates).

## Opening Stock (`/opening-stock`)
Snapshot of stock at the start of the company's accounting year, grouped by stock-group.

## Closing Stock Summary (`/closing-stock-summary`)
Snapshot at the end of the accounting period (or any selected month).

## Payroll (`/payroll`)
Employee management + payroll.
- Top tabs: **Employees**, **Salary Advances**, **Worker Groups**.
- Edit pencil on an employee opens the edit dialog with:
  - Basic info, base salary, opening balance.
  - **Per-Unit Rates** + **Percentage Rates** sections — set rates per location for moto-assembly piecework.
  - **View Rate History** button (top-right of the dialog) → shows every rate change with before/after diff.
- "Statement" button → opens a printable per-employee transaction statement.
- "Pay Salary" → posts a salary payment voucher; balance updates instantly.
- Worker Groups: group employees, then assign assembly tasks to a group instead of individuals.

## Customers (`/customers`)
Customer master + balances.
- Edit / "View Balance" / "Statement" buttons per row.
- "Create Customer" creates the customer + a paired ledger account automatically.

## Service (`/service`)
Bike-service jobs.
- "New Service" → pick customer + bike, list parts/labour, save.

## Purchase History (`/purchase-history`)
Customer-by-customer history of every bike + part they bought from you. Pick a customer from the dropdown.

## Service History (`/service-history`)
Same idea, for services rendered.

## Warranty (`/warranty`)
Manage warranty cards: pick customer, add new warranty (item, expiry, terms), view/print existing.

## Communication Log (`/communication-log`)
Log calls / messages with customers. Pick customer, add a note, save.

## Sales Report (`/sales-report`)
Daily / monthly / annual sales totals with date filter, by location.

## Income Statement (`/income-statement`)
P&L for the selected period. Drill into any account.

## Sold Containers (`/sold-containers`)
Container-level profitability — landed cost vs sales realised per container.

## Moto Assembly (`/moto-assembly`)
Bike assembly logger. Pick employee/group, location, output items, save → updates piecework payroll automatically.

## Assembly History (`/assembly-history`)
Past assembly records for audit and rate-history.

## Stock Transfer Order (`/stock-transfer-order`)
Move inventory between your locations. Pick source + destination + items + qty, save → both inventory + ledger update.

## Settings (`/settings`) — **Admin only**
- **Companies**: create/edit tenant.
- **Locations**: add stores per company.
- **Users**: invite users, assign role per company.
- **Stock Groups**: create category buckets for items.
- **Rate Templates**: build reusable bundles of per-location piecework rates and apply them to many employees in one click.
- **DB Stats / Health Deep**: admin diagnostics.

---

## Common workflows

### Recording a cash sale
POS → pick location → scan items → set qty/rate → Cash payment → Save → invoice prints.

### Recording a credit sale
POS → toggle **Credit Sale** → pick customer → Save. Customer balance increases. Receive payment later via **Vouchers → Receipt** or **Daybook → Pay / Receive**.

### Receiving a shipment
1. Containers → New Container → supplier + freight + items → Save.
2. Open the container → Offload to a location → quantities land in Stock Items.
3. Container ledger entry posts automatically.

### Paying salary / advance
Payroll → Salary Advances tab → pick employee + amount + cash/bank → Save. Or Pay Salary on the employee row.

### Bulk-applying rates to many employees
Settings → Rate Templates → create template (per-location rates) → Apply → multi-select employees → confirm.

### Restoring a deleted record
Settings → Deleted Items → pick type → Restore.

### Switching tenant
Top-left company switcher.

---

## Tips
- Most lists support live search and column sort.
- Date pickers default to "today"; pick a custom range from the dropdown.
- Reports are printable from the browser print dialog (Ctrl/Cmd+P).
- The bell icon will alert managers whenever an Admin or Owner changes a piecework rate.
