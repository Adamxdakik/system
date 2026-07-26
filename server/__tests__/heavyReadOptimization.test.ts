import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  buildWeightedStockHistory,
  calculateSignedAccountBalance,
  monthWindow,
  numericValue,
} from "../services/performance/heavyReadCalculations";

describe("heavy read calculations", () => {
  it("normalizes database numeric values safely", () => {
    expect(numericValue("12.50")).toBe(12.5);
    expect(numericValue(null)).toBe(0);
    expect(numericValue("not-a-number")).toBe(0);
  });

  it("preserves debit and credit account balance semantics", () => {
    expect(calculateSignedAccountBalance("100", "Dr", 50, 20)).toEqual({
      balance: 130,
      balanceSide: "Dr",
    });
    expect(calculateSignedAccountBalance("100", "Cr", 20, 50)).toEqual({
      balance: 130,
      balanceSide: "Cr",
    });
  });

  it("uses an index-friendly half-open monthly window", () => {
    const window = monthWindow(2026, 2);
    expect(window.monthStartDate).toBe("2026-02-01");
    expect(window.nextMonthStartDate).toBe("2026-03-01");
    expect(() => monthWindow(2026, 13)).toThrow("Invalid month");
  });

  it("preserves weighted-average outward valuation and closing-only opening rows", () => {
    const result = buildWeightedStockHistory({
      openingDate: "2026-07-01",
      openingQty: 10,
      openingValue: 50,
      openingRowMode: "closing-only",
      transactions: [
        {
          date: "2026-07-02",
          particulars: "Purchase",
          vchType: "PURCHASE IMPORT",
          voucherId: 0,
          inwardQty: 10,
          inwardRate: 7,
          inwardValue: 70,
          outwardQty: 0,
          outwardRate: 0,
          outwardValue: 0,
        },
        {
          date: "2026-07-03",
          particulars: "Cash",
          vchType: "POS",
          voucherId: 1,
          inwardQty: 0,
          inwardRate: 0,
          inwardValue: 0,
          outwardQty: 4,
          outwardRate: 0,
          outwardValue: 0,
        },
      ],
    });

    expect(result.transactions[0]).toMatchObject({
      isOpeningBalance: true,
      inwardQty: 0,
      closingQty: 10,
      closingRate: 5,
      closingValue: 50,
    });
    expect(result.transactions[2]).toMatchObject({
      outwardRate: 6,
      outwardValue: 24,
      closingQty: 16,
      closingValue: 96,
    });
    expect(result.totals).toMatchObject({
      inwardQty: 10,
      inwardValue: 70,
      outwardQty: 4,
      outwardValue: 24,
      closingQty: 16,
      closingRate: 6,
      closingValue: 96,
    });
  });

  it("supports inventory-reconciled final closing values", () => {
    const result = buildWeightedStockHistory({
      openingDate: "2026-07-01",
      openingQty: 5,
      openingValue: 50,
      openingRowMode: "inward",
      transactions: [],
      finalClosing: { qty: 4, value: 36 },
    });

    expect(result.transactions[0]).toMatchObject({
      inwardQty: 5,
      inwardValue: 50,
      closingQty: 4,
      closingRate: 9,
      closingValue: 36,
    });
    expect(result.totals).toMatchObject({
      inwardQty: 0,
      outwardQty: 0,
      closingQty: 4,
      closingRate: 9,
      closingValue: 36,
    });
  });
});

describe("heavy read optimization guardrails", () => {
  const stockRoutes = fs.readFileSync(
    path.resolve(import.meta.dirname, "../routes/optimizedStockHistoryRoutes.ts"),
    "utf8",
  );
  const accountRoutes = fs.readFileSync(
    path.resolve(import.meta.dirname, "../routes/optimizedAccountsRoutes.ts"),
    "utf8",
  );
  const indexSource = fs.readFileSync(path.resolve(import.meta.dirname, "../index.ts"), "utf8");

  it("uses grouped SQL and half-open date ranges instead of row scans and EXTRACT filters", () => {
    expect(stockRoutes).toContain("COALESCE(SUM");
    expect(stockRoutes).toContain("Promise.all");
    expect(stockRoutes).not.toContain("EXTRACT(");
  });

  it("removes the supplier N+1 account balance path", () => {
    expect(accountRoutes).toContain(".groupBy(voucherEntries.supplierId)");
    expect(accountRoutes).not.toContain("getVoucherEntriesBySupplier");
    expect(accountRoutes).toContain("inFlightAccounts");
  });

  it("registers optimized routes before the legacy monolithic routes", () => {
    expect(indexSource.indexOf("registerOptimizedAccountsRoutes(app)")).toBeGreaterThan(-1);
    expect(indexSource.indexOf("registerOptimizedStockHistoryRoutes(app)")).toBeGreaterThan(-1);
    expect(indexSource.indexOf("registerOptimizedAccountsRoutes(app)")).toBeLessThan(
      indexSource.indexOf("registerRoutes(app)"),
    );
    expect(indexSource.indexOf("registerOptimizedStockHistoryRoutes(app)")).toBeLessThan(
      indexSource.indexOf("registerRoutes(app)"),
    );
  });
});
