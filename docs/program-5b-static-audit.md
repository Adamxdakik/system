# Program 5B Static Heavy-API Audit

Generated from the exact Program 5 branch. This is code-level evidence only; production telemetry remains the source of truth after deployment.

## Highest-risk GET handlers

| Risk | Route | Source | Select/execute | Joins | Await | Loops | Limit | Lines |
|---:|---|---|---:|---:|---:|---:|---:|---:|
| 148 | `GET /api/locations/:locationId/stock-items/:stockItemId/vouchers/:year/:month` | `server/routes.ts:24406` | 13 | 24 | 16 | 16 | 0 | 753 |
| 99 | `GET /api/stock-items/:id/vouchers/:year/:month` | `server/routes.ts:23583` | 8 | 14 | 12 | 11 | 0 | 525 |
| 78 | `GET /api/stats/import-cycle-balance` | `server/routes.ts:19306` | 10 | 5 | 23 | 1 | 0 | 358 |
| 76 | `GET /api/stats/dashboard-metrics` | `server/routes.ts:17905` | 9 | 3 | 10 | 10 | 0 | 346 |
| 67 | `GET /api/stats/liquidation-value` | `server/routes.ts:19083` | 9 | 4 | 15 | 2 | 0 | 224 |
| 67 | `GET /api/stats/income-statement` | `server/routes.ts:18550` | 7 | 0 | 9 | 12 | 0 | 315 |
| 57 | `GET /api/stats/net-profit` | `server/routes.ts:17704` | 5 | 1 | 7 | 10 | 0 | 202 |
| 57 | `GET /api/stats/liquidation-history` | `server/routes.ts:18864` | 5 | 2 | 5 | 10 | 0 | 220 |
| 55 | `GET /api/voucher-detail/:voucherId` | `server/routes.ts:22193` | 9 | 2 | 11 | 0 | 0 | 185 |
| 55 | `GET /api/locations/:locationId/stock-items/:stockItemId/monthly-summary` | `server/routes.ts:24107` | 5 | 8 | 7 | 6 | 1 | 300 |
| 55 | `GET /api/location-summary` | `server/routes.ts:25158` | 3 | 0 | 3 | 15 | 0 | 379 |
| 54 | `GET /api/stock-items/:id/monthly-summary` | `server/routes.ts:23353` | 4 | 6 | 5 | 6 | 0 | 231 |
| 43 | `GET /api/reports/net-profit-statement` | `server/routes.ts:21010` | 5 | 1 | 7 | 3 | 0 | 308 |
| 41 | `GET /api/reports/ledger-vouchers/:accountId/:year/:month` | `server/routes.ts:22020` | 6 | 3 | 7 | 1 | 0 | 174 |
| 41 | `GET /api/dashboard-cash-accounts` | `server/routes.ts:22377` | 5 | 2 | 12 | 1 | 0 | 136 |
| 40 | `GET /api/deleted-items` | `server/routes.ts:25650` | 8 | 0 | 8 | 0 | 0 | 141 |
| 39 | `GET /api/vouchers/:id/view-entries` | `server/routes.ts:15111` | 3 | 3 | 11 | 0 | 0 | 277 |
| 35 | `GET /api/motorcycles/:id/timeline` | `server/routes/motorcycleTimelineRoutes.ts:54` | 4 | 0 | 2 | 4 | 0 | 195 |
| 33 | `GET /api/vouchers/:id` | `server/routes.ts:12881` | 5 | 0 | 18 | 0 | 2 | 180 |
| 33 | `GET /api/accounts/voucher-sidebar` | `server/routes.ts:11376` | 2 | 0 | 8 | 3 | 0 | 220 |
| 32 | `GET /api/stats/monthly-data` | `server/routes.ts:18250` | 3 | 0 | 4 | 3 | 0 | 181 |
| 30 | `GET /api/reports/ledger-monthly-summary/:accountId` | `server/routes.ts:21870` | 3 | 2 | 3 | 3 | 0 | 151 |
| 29 | `GET /api/accounts/all` | `server/routes.ts:11107` | 2 | 0 | 8 | 1 | 0 | 244 |
| 28 | `GET /api/stats/sales-expenses-drilldown` | `server/routes.ts:17531` | 4 | 0 | 4 | 2 | 0 | 174 |
| 27 | `GET /api/reports/balance-sheet` | `server/routes.ts:20013` | 2 | 0 | 6 | 1 | 0 | 216 |
| 27 | `GET /api/dashboard-payable-accounts` | `server/routes.ts:22559` | 3 | 1 | 6 | 1 | 0 | 97 |
| 26 | `GET /api/reports/opening-stock-summary` | `server/routes.ts:20610` | 2 | 2 | 4 | 2 | 0 | 154 |
| 25 | `GET /api/reports/ratios` | `server/routes.ts:20471` | 3 | 1 | 4 | 1 | 0 | 140 |
| 25 | `GET /api/offloads/:id` | `server/routes.ts:27454` | 1 | 2 | 4 | 3 | 0 | 82 |
| 24 | `GET /api/health/deep` | `server/routes.ts:2391` | 4 | 0 | 4 | 0 | 0 | 48 |
| 24 | `GET /api/dashboard-account-selections/:type` | `server/routes.ts:22709` | 2 | 1 | 4 | 2 | 0 | 84 |
| 22 | `GET /api/stock-query` | `server/routes.ts:6691` | 2 | 2 | 2 | 1 | 0 | 68 |
| 22 | `GET /api/reports/profit-loss` | `server/routes.ts:19906` | 3 | 0 | 3 | 1 | 0 | 108 |
| 21 | `GET /api/stats/expense-breakdown` | `server/routes.ts:18476` | 2 | 0 | 3 | 2 | 0 | 75 |
| 21 | `GET /api/reports/opening-stock-summary/:stockGroupId/items` | `server/routes.ts:20763` | 2 | 1 | 3 | 1 | 0 | 137 |
| 20 | `GET /api/stock-transfers` | `server/routes.ts:23073` | 2 | 2 | 2 | 0 | 0 | 68 |
| 20 | `GET /api/sales-report` | `server/routes.ts:19663` | 1 | 4 | 1 | 0 | 0 | 113 |
| 20 | `GET /api/reports/closing-stock-summary/:stockGroupId/items` | `server/routes.ts:21454` | 2 | 1 | 2 | 1 | 0 | 132 |
| 20 | `GET /api/reports/closing-stock-summary` | `server/routes.ts:21317` | 1 | 1 | 3 | 2 | 0 | 138 |
| 20 | `GET /api/orphaned-records` | `server/routes.ts:23235` | 2 | 2 | 2 | 0 | 0 | 70 |
| 20 | `GET /api/motorcycle-sales/vouchers/:voucherId/customer` | `server/routes/motorcycleSaleCustomerRoutes.ts:18` | 3 | 0 | 3 | 0 | 0 | 90 |
| 20 | `GET /api/debug/inventory/:stockItemId` | `server/routes.ts:20899` | 2 | 1 | 2 | 1 | 0 | 112 |
| 20 | `GET /api/admin/active-sessions` | `server/routes.ts:27326` | 3 | 0 | 3 | 0 | 0 | 35 |
| 19 | `GET /api/reports/net-profit-statement/purchase-accounts` | `server/routes.ts:21585` | 2 | 0 | 3 | 1 | 0 | 73 |
| 19 | `GET /api/reports/net-profit-statement/indirect-expenses` | `server/routes.ts:21799` | 2 | 0 | 3 | 1 | 0 | 72 |
| 19 | `GET /api/reports/net-profit-statement/direct-incomes` | `server/routes.ts:21657` | 2 | 0 | 3 | 1 | 0 | 72 |
| 19 | `GET /api/reports/net-profit-statement/direct-expenses` | `server/routes.ts:21728` | 2 | 0 | 3 | 1 | 0 | 72 |
| 19 | `GET /api/financial/sales/:locationId/transactions` | `server/routes.ts:16139` | 2 | 1 | 3 | 0 | 0 | 81 |
| 18 | `GET /api/reports/sales` | `server/routes.ts:20228` | 1 | 3 | 1 | 0 | 0 | 79 |
| 18 | `GET /api/moto-assemblies/:id` | `server/routes.ts:26532` | 2 | 1 | 2 | 0 | 0 | 43 |
| 18 | `GET /api/admin/legacy-employee-accounts` | `server/routes.ts:26183` | 2 | 0 | 4 | 0 | 0 | 68 |
| 17 | `GET /api/payroll/worker-payments-summary` | `server/routes.ts:4177` | 1 | 1 | 4 | 0 | 0 | 71 |
| 16 | `GET /api/worker-groups/with-members` | `server/routes.ts:3094` | 1 | 0 | 5 | 0 | 0 | 60 |
| 16 | `GET /api/offloads` | `server/routes.ts:27400` | 1 | 2 | 1 | 0 | 0 | 55 |
| 16 | `GET /api/financial/sales` | `server/routes.ts:15999` | 1 | 1 | 1 | 1 | 0 | 76 |
| 16 | `GET /api/admin/db-stats` | `server/routes.ts:27374` | 2 | 0 | 2 | 0 | 0 | 27 |
| 15 | `GET /api/reports/stock-movement` | `server/routes.ts:20306` | 1 | 1 | 2 | 0 | 0 | 92 |
| 14 | `GET /api/reports/containers` | `server/routes.ts:20397` | 1 | 1 | 1 | 0 | 0 | 75 |
| 14 | `GET /api/inventory-by-location/:locationId` | `server/routes.ts:23191` | 1 | 1 | 1 | 0 | 0 | 45 |
| 14 | `GET /api/health` | `server/routes.ts:298` | 1 | 0 | 3 | 0 | 0 | 29 |

## Client endpoint reference counts

| References | Endpoint | Files |
|---:|---|---:|
| 40 | `/api/ledger-accounts` | 17 |
| 36 | `/api/employees` | 10 |
| 34 | `/api/vouchers` | 15 |
| 33 | `/api/vouchers/` | 7 |
| 30 | `/api/accounts/all` | 7 |
| 29 | `/api/locations` | 25 |
| 24 | `/api/stock-items` | 18 |
| 23 | `/api/stock-items/` | 6 |
| 20 | `/api/suppliers` | 15 |
| 20 | `/api/containers/` | 5 |
| 19 | `/api/locations/` | 8 |
| 16 | `/api/salary-advances` | 4 |
| 15 | `/api/employees/` | 4 |
| 13 | `/api/bank-accounts` | 6 |
| 13 | `/api/customers` | 9 |
| 13 | `/api/stock-transfers` | 3 |
| 11 | `/api/location-summary` | 5 |
| 10 | `/api/customers/stats` | 5 |
| 9 | `/api/stock-groups` | 8 |
| 9 | `/api/containers` | 7 |
| 9 | `/api/worker-groups/with-members` | 2 |
| 9 | `/api/employee-groups` | 1 |
| 8 | `/api/motorcycles` | 4 |
| 8 | `/api/inventory` | 5 |
| 8 | `/api/bike-purchases/customer/` | 4 |
| 8 | `/api/suppliers/` | 4 |
| 8 | `/api/payroll/employees-with-balances` | 2 |
| 7 | `/api/accounts/` | 2 |
| 7 | `/api/customers/` | 5 |
| 7 | `/api/users/` | 1 |
| 6 | `/api/auth/me` | 4 |
| 6 | `/api/user-preferences` | 2 |
| 6 | `/api/service-history/customer/` | 3 |
| 6 | `/api/warranties/customer/` | 3 |
| 6 | `/api/communication-logs/customer/` | 3 |
| 6 | `/api/payroll/runs` | 1 |
| 6 | `/api/part-purchases/customer/` | 2 |
| 6 | `/api/inventory-by-location` | 4 |
| 6 | `/api/companies` | 3 |
| 5 | `/api/assembly-history` | 3 |
| 5 | `/api/motorcycles/` | 3 |
| 5 | `/api/payroll/sales-summary` | 1 |
| 5 | `/api/containers/active` | 2 |
| 5 | `/api/users` | 1 |
| 5 | `/api/accounts/voucher-sidebar` | 2 |
| 4 | `/api/user/companies` | 2 |
| 4 | `/api/salary-advances/` | 3 |
| 4 | `/api/erp-worker-docs/` | 1 |
| 4 | `/api/bike-purchases/` | 2 |
| 4 | `/api/part-purchases/` | 2 |
| 4 | `/api/factory/suppliers` | 2 |
| 4 | `/api/factory/suppliers/` | 2 |
| 4 | `/api/ledger-accounts/` | 3 |
| 4 | `/api/purchase-orders/` | 2 |
| 4 | `/api/stock-adjustments` | 1 |
| 4 | `/api/daybook` | 1 |
| 3 | `/api/companies/` | 2 |
| 3 | `/api/auth/set-company` | 3 |
| 3 | `/api/suppliers/stats` | 3 |
| 3 | `/api/fixed-assets` | 3 |

## Client automatic refetch configuration

- `client/src/lib/queryClient.ts:63` — `refetchInterval: false,`
- `client/src/components/NotificationBell.tsx:26` — `refetchInterval: 60_000,`
- `client/src/pages/Settings.tsx:183` — `refetchInterval: activeSettingsSection === "users-security" ? 15000 : false,`
- `client/src/pages/Settings.tsx:210` — `refetchInterval:`

## Client timer calls

- `client/src/App.tsx:107` — `const timer = setInterval(send, 30000);`

## Audit scope

- Server TypeScript files scanned: 77
- Express routes detected: 436
- Client TypeScript files scanned: 173
- Unique client API references detected: 194
