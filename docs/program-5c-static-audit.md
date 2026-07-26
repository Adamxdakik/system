# Program 5C Export and Memory Audit

Generated from the exact Program 5 branch. This is a static audit; production telemetry and representative export sizes remain the final acceptance evidence.

## Export-route candidates

| Risk | Route | Source | Queries | Await | Loops | XLSX | PDF | Buffers | Write buffer | Limit | Lines |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 74 | `GET /api/stats/income-statement` | `server/routes.ts:18550` | 7 | 9 | 12 | 0 | 0 | 0 | 0 | 0 | 315 |
| 52 | `GET /api/stock-transfer-import/template-multi-source` | `server/routes.ts:8502` | 0 | 1 | 0 | 6 | 0 | 3 | 1 | 0 | 48 |
| 52 | `GET /api/stock-transfer-import/template` | `server/routes.ts:8463` | 0 | 1 | 0 | 6 | 0 | 3 | 1 | 0 | 40 |
| 52 | `GET /api/pos-import/template` | `server/routes.ts:8044` | 0 | 1 | 0 | 6 | 0 | 3 | 1 | 0 | 42 |
| 48 | `GET /api/reports/net-profit-statement` | `server/routes.ts:21010` | 5 | 7 | 3 | 0 | 0 | 0 | 0 | 0 | 308 |
| 44 | `POST /api/upload` | `server/__tests__/httpSafety.test.ts:291` | 0 | 9 | 1 | 3 | 0 | 4 | 0 | 0 | 72 |
| 39 | `POST /api/po-import/parse` | `server/routes.ts:6915` | 0 | 4 | 2 | 2 | 0 | 3 | 0 | 0 | 232 |
| 23 | `POST /api/stock-transfer-import/parse-multi-source` | `server/routes.ts:8549` | 0 | 1 | 1 | 2 | 0 | 2 | 0 | 0 | 73 |
| 23 | `POST /api/stock-transfer-import/parse` | `server/routes.ts:8085` | 0 | 1 | 1 | 2 | 0 | 2 | 0 | 0 | 64 |
| 23 | `POST /api/pos-import/parse` | `server/routes.ts:7683` | 0 | 1 | 1 | 2 | 0 | 2 | 0 | 0 | 66 |
| 21 | `GET /api/reports/net-profit-statement/purchase-accounts` | `server/routes.ts:21585` | 2 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 73 |
| 21 | `GET /api/reports/net-profit-statement/indirect-expenses` | `server/routes.ts:21799` | 2 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 72 |
| 21 | `GET /api/reports/net-profit-statement/direct-incomes` | `server/routes.ts:21657` | 2 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 72 |
| 21 | `GET /api/reports/net-profit-statement/direct-expenses` | `server/routes.ts:21728` | 2 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 72 |
| 19 | `POST /api/companies/:id/moto-rates/import.csv` | `server/routes.ts:2578` | 0 | 5 | 3 | 0 | 0 | 1 | 0 | 0 | 109 |
| 19 | `GET /api/download` | `server/__tests__/securityHeaders.test.ts:37` | 0 | 8 | 0 | 2 | 0 | 0 | 0 | 0 | 49 |
| 12 | `POST /api/upload` | `server/__tests__/httpSafety.test.ts:263` | 0 | 2 | 0 | 1 | 0 | 1 | 0 | 0 | 29 |
| 6 | `PUT /api/vouchers/:id/sales` | `server/__tests__/financialAudit.characterization.test.ts:163` | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 60 |
| 5 | `GET /api/companies/:id/moto-rates/export.csv` | `server/routes.ts:2854` | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 77 |
| 2 | `GET /api/customers/:id/statement` | `server/routes.ts:23044` | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 30 |
| 1 | `POST /api/notifications/mark-read` | `server/routes.ts:2838` | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 17 |

## Client export/download call sites

- `client/src/lib/excelHelper.ts:136` — `a.download = filename;`
- `client/src/components/ERPWorkerDetail.tsx:18` — `DollarSign, Upload, Trash2, Download, Eye, Pencil, Banknote, Plus`
- `client/src/components/ERPWorkerDetail.tsx:336` — `const handleDownload = (doc: ErpWorkerDoc) => {`
- `client/src/components/ERPWorkerDetail.tsx:337` — `/api/erp-worker-docs/` — `window.open(`/api/erp-worker-docs/${doc.id}/download`, "_blank");`
- `client/src/components/ERPWorkerDetail.tsx:341` — `/api/erp-worker-docs/` — `window.open(`/api/erp-worker-docs/${doc.id}/download`, "_blank");`
- `client/src/components/ERPWorkerDetail.tsx:696` — `<Button size="icon" variant="ghost" onClick={() => handleDownload(doc)} data-testid={`button-download-doc-${doc.id}`}>`
- `client/src/components/ERPWorkerDetail.tsx:697` — `<Download className="h-3.5 w-3.5" />`
- `client/src/components/CombinedImportDialog.tsx:11` — `import { Download, Package } from "lucide-react";`
- `client/src/components/CombinedImportDialog.tsx:65` — `/api/reports/net-profit-statement` — `queryClient.invalidateQueries({ queryKey: ["/api/reports/net-profit-statement"] });`
- `client/src/components/CombinedImportDialog.tsx:80` — `const downloadPricesTemplate = async () => {`
- `client/src/components/CombinedImportDialog.tsx:92` — `title: "Template Downloaded",`
- `client/src/components/CombinedImportDialog.tsx:168` — `const downloadOpeningTemplate = async () => {`
- `client/src/components/CombinedImportDialog.tsx:180` — `title: "Template Downloaded",`
- `client/src/components/CombinedImportDialog.tsx:295` — `onClick={downloadOpeningTemplate}`
- `client/src/components/CombinedImportDialog.tsx:296` — `data-testid="button-download-opening-template"`
- `client/src/components/CombinedImportDialog.tsx:298` — `<Download className="h-4 w-4" />`
- `client/src/components/CombinedImportDialog.tsx:299` — `Download Template`
- `client/src/components/CombinedImportDialog.tsx:358` — `onClick={downloadPricesTemplate}`
- `client/src/components/CombinedImportDialog.tsx:359` — `data-testid="button-download-prices-template"`
- `client/src/components/CombinedImportDialog.tsx:361` — `<Download className="h-4 w-4" />`
- `client/src/components/CombinedImportDialog.tsx:362` — `Download Template`
- `client/src/components/ERPRunPayroll.tsx:503` — `// Trigger download`
- `client/src/components/ERPRunPayroll.tsx:511` — `a.download = `payroll-run-${run.id}-${run.date}.xlsx`;`
- `client/src/pages/Accounts.tsx:412` — `/api/factory/workers/` — `? `/api/factory/workers/${selectedAccount.accountId}/statement``
- `client/src/pages/Accounts.tsx:426` — `/api/factory/workers/` — `url = `/api/factory/workers/${selectedAccount.accountId}/statement${`
- `client/src/pages/Accounts.tsx:450` — `/api/factory/suppliers` — `? ["/api/factory/suppliers", selectedAccount.accountId, "statement"]`
- `client/src/pages/Accounts.tsx:454` — `/api/factory/suppliers/` — `const res = await fetch(`/api/factory/suppliers/${selectedAccount.accountId}/statement`, {`
- `client/src/pages/Accounts.tsx:468` — `/api/factory/suppliers` — `? ["/api/factory/suppliers", selectedAccount.accountId, "broker-statement"]`
- `client/src/pages/Accounts.tsx:473` — `/api/factory/suppliers/` — ``/api/factory/suppliers/${selectedAccount.accountId}/broker-statement`,`
- `client/src/pages/Accounts.tsx:876` — `description: `Downloaded ${fileName} with ${vouchersWithBalance.length} transactions.`,`
- `client/src/pages/Accounts.tsx:888` — `/api/factory/workers/` — `window.open(`/api/factory/workers/${selectedAccount.accountId}/statement-pdf${qs}`, "_blank");`
- `client/src/pages/Accounts.tsx:893` — `/api/accounts/` — ``/api/accounts/${accountType}/${selectedAccount.accountId}/statement-pdf${qs}`,`
- `client/src/pages/StockTransferOrder.tsx:668` — `description: `Downloaded ${fileName} with ${orderItems.length} items.`,`
- `client/src/pages/StockTransferOrder.tsx:691` — `description: `Downloaded ${fileName}.`,`
- `client/src/pages/POSImport.tsx:12` — `import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download, ShoppingCart, AlertTriangle } from "lucide-react";`
- `client/src/pages/POSImport.tsx:277` — `const downloadTemplate = () => {`
- `client/src/pages/POSImport.tsx:296` — `<Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">`
- `client/src/pages/POSImport.tsx:297` — `<Download className="h-4 w-4 mr-2" />`
- `client/src/pages/POSImport.tsx:298` — `Download Template`
- `client/src/pages/ImportStockItems.tsx:9` — `import { ArrowLeft, Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";`
- `client/src/pages/ImportStockItems.tsx:37` — `const downloadTemplate = async () => {`
- `client/src/pages/ImportStockItems.tsx:49` — `title: "Template Downloaded",`
- `client/src/pages/ImportStockItems.tsx:223` — `Download the template, fill in your stock items data, and upload it here`
- `client/src/pages/ImportStockItems.tsx:230` — `onClick={downloadTemplate}`
- `client/src/pages/ImportStockItems.tsx:231` — `data-testid="button-download-template"`
- `client/src/pages/ImportStockItems.tsx:233` — `<Download className="h-4 w-4 mr-2" />`
- `client/src/pages/ImportStockItems.tsx:234` — `Download Template`
- `client/src/pages/Analytics.tsx:524` — `/api/reports/net-profit-statement` — `return `/api/reports/net-profit-statement?${params}`;`
- `client/src/pages/Analytics.tsx:529` — `/api/reports/net-profit-statement` — `queryKey: ["/api/reports/net-profit-statement", selectedCompany?.id, plStartDate, plEndDate],`
- `client/src/pages/Analytics.tsx:895` — `toast({ title: "Excel Exported", description: "Report downloaded successfully" });`
- `client/src/pages/StockItems.tsx:25` — `Download,`
- `client/src/pages/StockItems.tsx:526` — `<Download className="mr-2 h-4 w-4" />`
- `client/src/pages/Suppliers.tsx:32` — `Download,`
- `client/src/pages/Suppliers.tsx:329` — `<Download className="h-3.5 w-3.5 mr-1.5" />`
- `client/src/pages/Daybook.tsx:1159` — `description: `Downloaded ${fileName} with ${filteredVouchers.length} records.`,`
- `client/src/pages/Daybook.tsx:1375` — `description: `Downloaded ${fileName} — ${failureCount} transaction detail${failureCount === 1 ? "" : "s"} could not be fetched.`,`
- `client/src/pages/Daybook.tsx:1380` — `description: `Downloaded ${fileName} with ${detailedData.length} entries from ${filteredVouchers.length} vouchers across ${sortedTypes.length} sheets.`,`
- `client/src/pages/Payroll.tsx:284` — `/api/accounts/employee` — `queryKey: ["/api/accounts/employee", statementEmployee?.id, "transactions"],`
- `client/src/pages/Payroll.tsx:287` — `/api/accounts/employee/` — `const res = await fetch(`/api/accounts/employee/${statementEmployee.id}/transactions`, { credentials: "include" });`
- `client/src/pages/Containers.tsx:14` — `Download,`
- `client/src/pages/Containers.tsx:333` — `<Download className="h-4 w-4" />`
- `client/src/pages/Vouchers.tsx:69` — `Download,`
- `client/src/pages/Vouchers.tsx:1909` — `description: `Downloaded ${fileName} with ${validEntries.length} entries.`,`
- `client/src/pages/Vouchers.tsx:1933` — `description: `Downloaded ${fileName}.`,`
- `client/src/pages/Vouchers.tsx:2352` — `description: `Downloaded ${fileName} with ${validEntries.length} entries.`,`
- `client/src/pages/Vouchers.tsx:2383` — `description: `Downloaded ${fileName}.`,`
- `client/src/pages/Vouchers.tsx:2710` — `const downloadImportTemplate = () => {`
- `client/src/pages/Vouchers.tsx:3651` — `description: `Downloaded ${fileName} with ${validEntries.length} items.`,`
- `client/src/pages/Vouchers.tsx:3689` — `description: `Downloaded ${fileName}.`,`
- `client/src/pages/Vouchers.tsx:3738` — `description: `Downloaded ${fileName} with ${validEntries.length} items.`,`
- `client/src/pages/Vouchers.tsx:3771` — `description: `Downloaded ${fileName}.`,`
- `client/src/pages/Vouchers.tsx:7067` — `onClick={downloadImportTemplate}`
- `client/src/pages/Vouchers.tsx:7069` — `data-testid="button-download-import-template"`
- `client/src/pages/Vouchers.tsx:7071` — `<Download className="h-4 w-4 mr-2" />`
- `client/src/pages/IncomeStatement.tsx:122` — `/api/stats/income-statement` — `queryKey: [`/api/stats/income-statement?${qs}`],`
- `client/src/pages/IncomeStatement.tsx:607` — `/api/customers/` — `queryKey: [`/api/customers/${selectedCustomerId}/statement`, selectedCustomerId],`
- `client/src/pages/StockTransferImport.tsx:23` — `import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download, ArrowRightLeft } from "lucide-react";`
- `client/src/pages/StockTransferImport.tsx:299` — `const downloadTemplate = () => {`
- `client/src/pages/StockTransferImport.tsx:328` — `<Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">`
- `client/src/pages/StockTransferImport.tsx:329` — `<Download className="h-4 w-4 mr-2" />`
- `client/src/pages/StockTransferImport.tsx:330` — `Download Template`
- `client/src/pages/POImport.tsx:24` — `import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download, Check, ChevronsUpDown } from "lucide-react";`
- `client/src/pages/POImport.tsx:313` — `const handleDownloadTemplate = () => {`
- `client/src/pages/POImport.tsx:323` — `onClick={handleDownloadTemplate}`
- `client/src/pages/POImport.tsx:324` — `data-testid="button-download-template"`
- `client/src/pages/POImport.tsx:326` — `<Download className="w-4 h-4 mr-2" />`
- `client/src/pages/POImport.tsx:327` — `Download Template`
- `client/src/pages/POImport.tsx:335` — `Three-step process: Parse → Validate → Import. Need help? Download the template above to see the required format.`
- `client/src/pages/stock-transfer.tsx:449` — `description: `Downloaded ${fileName} with ${allStockTransferVouchers.length} records.`,`
- `client/src/pages/stock-transfer.tsx:552` — `description: `Downloaded ${fileName} with ${detailedData.length} items from ${allStockTransferVouchers.length} transfers.`,`

## Memory-sensitive call sites

- `server/chatService.ts:56` — `] = await Promise.all([`
- `server/chatService.ts:252` — `const supplierBalances = await Promise.all(`
- `server/storage.ts:6334` — `const [rows, totalRow] = await Promise.all([`
- `server/routes.ts:176` — `storage: multer.memoryStorage(),`
- `server/routes.ts:603` — `const companiesWithRoles = await Promise.all(`
- `server/routes.ts:2465` — `const [rates, pctRates] = await Promise.all([`
- `server/routes.ts:2499` — `const [rates, pctRates] = await Promise.all([`
- `server/routes.ts:3114` — `const groupsWithMembers = await Promise.all(`
- `server/routes.ts:3122` — `const members = await Promise.all(`
- `server/routes.ts:4191` — `const workerPayments = await Promise.all(`
- `server/routes.ts:4267` — `const suppliersWithStats = await Promise.all(`
- `server/routes.ts:4445` — `const customersWithBalances = await Promise.all(`
- `server/routes.ts:6455` — `const [purchases, sales, inventoryLocations] = await Promise.all([`
- `server/routes.ts:9175` — `const allLineItems = await Promise.all(pos.map((po) => storage.getLineItemsByPO(po.id)));`
- `server/routes.ts:11300` — `const supplierAccountsList = await Promise.all(`
- `server/routes.ts:12922` — `const itemsWithDetails = await Promise.all(`
- `server/routes.ts:12956` — `const itemsWithDetails = await Promise.all(`
- `server/routes.ts:13009` — `const itemsWithDetails = await Promise.all(`
- `server/routes.ts:16179` — `const transactions = await Promise.all(`
- `server/routes.ts:22115` — `const vouchersWithDetails = await Promise.all(`
- `server/routes.ts:22284` — `const items = await Promise.all(`
- `server/routes.ts:22322` — `const entries = await Promise.all(`
- `server/routes.ts:22457` — `const enrichedAccounts = await Promise.all(`
- `server/routes.ts:22619` — `const enrichedAccounts = await Promise.all(`
- `server/routes.ts:26201` — `const accountsWithUsage = await Promise.all(`
- `server/lib/excel.ts:116` — `const buf = await workbook.xlsx.writeBuffer();`
- `server/lib/excel.ts:117` — `return Buffer.from(buf);`
- `server/__tests__/securityHeaders.test.ts:10` — `await Promise.all(`
- `server/__tests__/typescriptConfig.test.ts:8` — `return JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8")) as Record<`
- `server/__tests__/financialAudit.characterization.test.ts:17` — `const routesSource = fs.readFileSync(path.resolve(import.meta.dirname, "../routes.ts"), "utf8");`
- `server/__tests__/financialAudit.characterization.test.ts:18` — `const storageSource = fs.readFileSync(path.resolve(import.meta.dirname, "../storage.ts"), "utf8");`
- `server/__tests__/financialAudit.characterization.test.ts:19` — `const schemaSource = fs.readFileSync(`
- `server/__tests__/httpSafety.test.ts:21` — `await Promise.all(`
- `server/__tests__/httpSafety.test.ts:277` — `const routesSource = fs.readFileSync(path.resolve(import.meta.dirname, "../routes.ts"), "utf8");`
- `server/__tests__/httpSafety.test.ts:288` — `storage: multer.memoryStorage(),`
- `server/__tests__/heavyReadOptimization.test.ts:122` — `const stockRoutes = fs.readFileSync(`
- `server/__tests__/heavyReadOptimization.test.ts:126` — `const accountRoutes = fs.readFileSync(`
- `server/__tests__/heavyReadOptimization.test.ts:130` — `const indexSource = fs.readFileSync(path.resolve(import.meta.dirname, "../index.ts"), "utf8");`
- `server/__tests__/authSecurity.test.ts:35` — `await Promise.all(`
- `server/routes/optimizedStockHistoryRoutes.ts:106` — `const [priorPOResult, priorAdjustmentResult, priorSalesResult] = await Promise.all([`
- `server/routes/optimizedStockHistoryRoutes.ts:164` — `const [poItems, transferItems, adjustmentItems, salesData] = await Promise.all([`
- `server/routes/optimizedStockHistoryRoutes.ts:384` — `const [stockItem, location] = await Promise.all([`
- `server/routes/optimizedStockHistoryRoutes.ts:407` — `] = await Promise.all([`
- `server/routes/optimizedStockHistoryRoutes.ts:519` — `await Promise.all([`
- `server/routes/optimizedStockHistoryRoutes.ts:617` — `const [transferItems, adjustmentItems, salesData, offloadData] = await Promise.all([`
- `server/routes/motorcycleTimelineRoutes.ts:68` — `await Promise.all([`
- `server/routes/optimizedAccountsRoutes.ts:60` — `] = await Promise.all([`

## Audit scope

- Server TypeScript files scanned: 80
- Client TypeScript files scanned: 173
- Export route candidates: 21
- Client export/download call sites: 90
- Memory-sensitive call sites: 47
