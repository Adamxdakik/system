/**
 * Storage-layer regression tests for moto-rate CRUD.
 *
 * Covers PUT replace-all semantics (replaceEmployeeMotoRates and replaceEmployeeMotoPctRates)
 * and per-employee isolation. Uses synthetic employee_id values that do not collide with
 * real records and cleans up after itself.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../db";
import { storage } from "../storage";
import { employeeMotoRates, employeeMotoPctRates } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

// Synthetic employee_ids well outside any plausible real range.
const EMP_A = -1_000_001;
const EMP_B = -1_000_002;
const ALL_EMPS = [EMP_A, EMP_B];

async function cleanup() {
  await db.delete(employeeMotoRates).where(inArray(employeeMotoRates.employeeId, ALL_EMPS));
  await db.delete(employeeMotoPctRates).where(inArray(employeeMotoPctRates.employeeId, ALL_EMPS));
}

describe("moto-rate storage", () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  describe("replaceEmployeeMotoRates", () => {
    it("inserts rows when the employee has none", async () => {
      const saved = await storage.replaceEmployeeMotoRates(EMP_A, [
        { locationId: 100, rate: "5.50" },
        { locationId: 101, rate: "6.25", sourceCompanyId: 7 },
      ]);
      expect(saved).toHaveLength(2);
      expect(saved.map((r) => r.locationId).sort()).toEqual([100, 101]);

      const fetched = await storage.getEmployeeMotoRates(EMP_A);
      expect(fetched).toHaveLength(2);
    });

    it("replaces all existing rows on subsequent PUT (replace-all semantics)", async () => {
      // Pre-populated by previous test: 2 rows for EMP_A
      const saved = await storage.replaceEmployeeMotoRates(EMP_A, [
        { locationId: 200, rate: "9.99" },
      ]);
      expect(saved).toHaveLength(1);

      const fetched = await storage.getEmployeeMotoRates(EMP_A);
      expect(fetched).toHaveLength(1);
      expect(fetched[0].locationId).toBe(200);
      expect(fetched[0].rate).toBe("9.9900");
    });

    it("clears all rows when called with an empty array", async () => {
      await storage.replaceEmployeeMotoRates(EMP_A, []);
      const fetched = await storage.getEmployeeMotoRates(EMP_A);
      expect(fetched).toHaveLength(0);
    });

    it("isolates rows by employeeId — saving for EMP_B does not touch EMP_A", async () => {
      await storage.replaceEmployeeMotoRates(EMP_A, [{ locationId: 100, rate: "1.00" }]);
      await storage.replaceEmployeeMotoRates(EMP_B, [
        { locationId: 100, rate: "2.00" },
        { locationId: 101, rate: "3.00" },
      ]);

      const aRates = await storage.getEmployeeMotoRates(EMP_A);
      const bRates = await storage.getEmployeeMotoRates(EMP_B);
      expect(aRates).toHaveLength(1);
      expect(aRates[0].rate).toBe("1.0000");
      expect(bRates).toHaveLength(2);
      expect(bRates.find((r) => r.locationId === 100)?.rate).toBe("2.0000");
    });
  });

  describe("replaceEmployeeMotoPctRates", () => {
    it("inserts, replaces, and clears with the same semantics", async () => {
      const ins = await storage.replaceEmployeeMotoPctRates(EMP_A, [
        { locationId: 100, pct: "2.5", sourceCompanyId: 7 },
        { locationId: 101, pct: "1.75" },
      ]);
      expect(ins).toHaveLength(2);

      const replaced = await storage.replaceEmployeeMotoPctRates(EMP_A, [
        { locationId: 200, pct: "10.00" },
      ]);
      expect(replaced).toHaveLength(1);
      const refetched = await storage.getEmployeeMotoPctRates(EMP_A);
      expect(refetched).toHaveLength(1);
      expect(refetched[0].locationId).toBe(200);

      await storage.replaceEmployeeMotoPctRates(EMP_A, []);
      const empty = await storage.getEmployeeMotoPctRates(EMP_A);
      expect(empty).toHaveLength(0);
    });

    it("preserves sourceCompanyId when provided, null otherwise", async () => {
      const saved = await storage.replaceEmployeeMotoPctRates(EMP_B, [
        { locationId: 100, pct: "5.0", sourceCompanyId: 42 },
        { locationId: 101, pct: "5.0" },
      ]);
      const withSrc = saved.find((r) => r.locationId === 100);
      const noSrc = saved.find((r) => r.locationId === 101);
      expect(withSrc?.sourceCompanyId).toBe(42);
      expect(noSrc?.sourceCompanyId).toBeNull();
    });
  });
});
