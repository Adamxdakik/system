import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  aggregateDaybook,
  auditVoucherEntries,
  companyIsolationIssues,
  duplicateSourceReferences,
  fromMinorUnits,
  incomeStatement,
  netPosition,
  toMinorUnits,
  trialBalanceDifference,
  type ReportEntry,
} from "../financialAuditCore";

const routesSource = fs.readFileSync(path.resolve(import.meta.dirname, "../routes.ts"), "utf8");
const storageSource = fs.readFileSync(path.resolve(import.meta.dirname, "../storage.ts"), "utf8");
const schemaSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../../shared/schema.ts"),
  "utf8",
);

const balancedEntries: ReportEntry[] = [
  { debitAmount: "100.10", creditAmount: "0", accountType: "Expense" },
  { debitAmount: "0", creditAmount: "100.10", accountType: "Asset" },
];

describe("required accounting invariants", () => {
  it("required invariant: accepts a balanced two-entry journal with decimal-safe totals", () => {
    const result = auditVoucherEntries(balancedEntries);
    expect(result).toMatchObject({ balanced: true, issues: [] });
    expect(fromMinorUnits(result.debitMinor)).toBe("100.10");
  });

  it("required invariant: rejects an unbalanced voucher", () => {
    const result = auditVoucherEntries([
      { debitAmount: "0.10", creditAmount: "0" },
      { debitAmount: "0", creditAmount: "0.09" },
    ]);
    expect(result.balanced).toBe(false);
    expect(result.issues).toContain("unbalanced");
  });

  it("required invariant: enforces meaningful debit and credit structure", () => {
    expect(
      auditVoucherEntries([
        { debitAmount: "0", creditAmount: "0" },
        { debitAmount: "1", creditAmount: "1" },
      ]).issues,
    ).toEqual(
      expect.arrayContaining([
        "entry[0]:zero-value",
        "entry[1]:both-debit-and-credit",
        "fewer-than-two-meaningful-entries",
      ]),
    );
  });

  it("required invariant: requires at least one debit and one credit", () => {
    expect(
      auditVoucherEntries([
        { debitAmount: "2", creditAmount: "0" },
        { debitAmount: "3", creditAmount: "0" },
      ]).issues,
    ).toEqual(expect.arrayContaining(["missing-credit", "unbalanced"]));
  });

  it("required invariant: rejects negative debit or credit amounts", () => {
    expect(auditVoucherEntries([{ debitAmount: "-1", creditAmount: "0" }]).issues).toContain(
      "entry[0]:negative-amount",
    );
  });

  it("required invariant: detects cross-company account references", () => {
    expect(
      companyIsolationIssues(1, [
        { debitAmount: "1", creditAmount: "0", accountCompanyId: 1 },
        { debitAmount: "0", creditAmount: "1", accountCompanyId: 2 },
      ]),
    ).toEqual(["entry[1]:account-company-2"]);
  });

  it("required invariant: preserves exact cents without floating-point equality", () => {
    expect(toMinorUnits("9007199254740993.01")).toBe(900719925474099301n);
    expect(() => toMinorUnits("1.001")).toThrow(/more than 2 decimal places/);
  });

  it("required invariant: daybook totals come from voucher entries", () => {
    expect(aggregateDaybook(balancedEntries)).toEqual({
      debitMinor: 10010n,
      creditMinor: 10010n,
    });
  });

  it("required invariant: trial balance debits equal credits", () => {
    expect(trialBalanceDifference(balancedEntries)).toBe(0n);
  });

  it("required invariant: income statement classifies income and expense ledgers", () => {
    const result = incomeStatement([
      { debitAmount: "0", creditAmount: "250", accountType: "Income" },
      { debitAmount: "75", creditAmount: "0", accountType: "Direct Expense" },
    ]);
    expect(result).toEqual({
      incomeMinor: 25000n,
      expenseMinor: 7500n,
      netIncomeMinor: 17500n,
    });
  });

  it("required invariant: net-position aggregation is internally consistent", () => {
    expect(netPosition(balancedEntries)).toBe(0n);
  });

  it("required invariant: duplicate source references are company scoped", () => {
    expect(
      duplicateSourceReferences([
        { companyId: 1, sourceType: "POS", sourceReference: "sale-1" },
        { companyId: 1, sourceType: "POS", sourceReference: "sale-1" },
        { companyId: 2, sourceType: "POS", sourceReference: "sale-1" },
      ]),
    ).toEqual(["1:POS:sale-1"]);
  });
});

describe("current financial-flow characterization", () => {
  it("expected current behavior: payment posting creates debit and credit legs", () => {
    expect(routesSource).toContain('"/api/vouchers/payment-receipt"');
    expect(routesSource).toContain("// Payment: Debit the expense/asset accounts");
    expect(routesSource).toContain("// Credit the payment account");
  });

  it("expected current behavior: receipt posting creates debit and credit legs", () => {
    expect(routesSource).toContain("// Receipt: Debit the payment account");
    expect(routesSource).toContain("// Credit the income/liability accounts");
  });

  it("expected current behavior: customer balances are maintained as a running history", () => {
    expect(storageSource).toContain("async addCustomerBalanceEntry");
    expect(storageSource).toContain("balance: sql`(${currentBalance}::decimal +");
  });

  it("expected current behavior: supplier balances are derived from voucher entries", () => {
    expect(routesSource).toContain('"/api/suppliers/:supplierId/unified-ledger"');
    expect(schemaSource).not.toContain("supplier_balances");
  });

  it("expected current behavior: employee currentBalance is synchronized from voucher entries", () => {
    expect(routesSource).toContain("async function syncEmployeeBalancesFromEntries");
    expect(routesSource).toContain("currentBalance: newBalance.toFixed(2)");
  });

  it("known accounting defect: POS sale creation uses compensation instead of db.transaction", () => {
    const start = routesSource.indexOf('app.post("/api/pos/sales"');
    const end = routesSource.indexOf("// Update existing sales voucher", start);
    const block = routesSource.slice(start, end);
    expect(block).not.toContain("db.transaction");
    expect(block).toContain("// Comprehensive cleanup: rollback all changes");
  });

  it("expected current behavior: POS sale edit uses one transaction", () => {
    const start = routesSource.indexOf('app.put("/api/vouchers/:id/sales"');
    const end = routesSource.indexOf("// Draft POS Sales Routes", start);
    expect(routesSource.slice(start, end)).toContain("await db.transaction(async (tx)");
  });

  it("known accounting defect: voucher deletion calls a global-db balance helper inside a transaction", () => {
    const start = routesSource.indexOf("// Delete a voucher (Admin only)");
    const end = routesSource.indexOf("// Fiscal Period Closing", start);
    const block = routesSource.slice(start, end);
    expect(block).toContain("await db.transaction(async (tx)");
    expect(block).toContain("await syncEmployeeBalancesFromEntries(");
    expect(routesSource).toContain("async function syncEmployeeBalancesFromEntries");
    expect(
      routesSource.slice(0, routesSource.indexOf("export async function registerRoutes")),
    ).toContain("await db");
  });

  it("expected current behavior: selected voucher dates are written from request fields", () => {
    expect(routesSource).toContain("voucherDate: parsed.advanceDate");
    expect(routesSource).toContain("const voucherDate = providedVoucherDate ||");
    expect(routesSource).toContain("voucherDate,");
  });

  it("known accounting defect: historical voucher FX values have no persisted schema fields", () => {
    const voucherSchemaStart = schemaSource.indexOf('export const vouchers = pgTable("vouchers"');
    const voucherSchemaEnd = schemaSource.indexOf(
      "export const insertVoucherSchema",
      voucherSchemaStart,
    );
    const block = schemaSource.slice(voucherSchemaStart, voucherSchemaEnd);
    expect(block).not.toContain("currency");
    expect(block).not.toContain("exchangeRate");
  });

  it("known accounting defect: multi-table salary advance posting has no transaction", () => {
    const start = routesSource.indexOf('"/api/salary-advances"');
    const end = routesSource.indexOf('"/api/salary-advances/:id/deduction"', start);
    const block = routesSource.slice(start, end);
    expect(block).toContain("insert(vouchers)");
    expect(block).toContain("insert(voucherEntries)");
    expect(block).not.toContain("db.transaction");
  });

  it("known accounting defect: timestamp voucher numbers are the only duplicate-request guard", () => {
    expect(routesSource).toContain("`SALES-${Date.now()}`");
    expect(routesSource).not.toContain("Idempotency-Key");
  });

  it("expected current behavior: report routes aggregate voucher entries", () => {
    expect(routesSource).toContain('"/api/stats/income-statement"');
    expect(routesSource).toContain('"/api/reports/net-profit-statement"');
    expect(routesSource).toContain(".from(voucherEntries)");
  });

  it("known accounting defect: no dedicated trial-balance or net-position route exists", () => {
    expect(routesSource).not.toMatch(/["']\/api\/[^"']*trial-balance/);
    expect(routesSource).not.toMatch(/["']\/api\/[^"']*net-position/);
  });
});
