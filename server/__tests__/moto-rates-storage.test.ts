/**
 * Storage-layer regression tests for moto-rate CRUD.
 *
 * Covers PUT replace-all semantics (replaceEmployeeMotoRates and replaceEmployeeMotoPctRates)
 * and per-employee isolation. Uses real seeded employee/location records (run
 * `npm run seed:dev` before this test) because the FK constraints added in
 * migration 0007 reject synthetic IDs. Cleans up its own rows before/after.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../db";
import { storage } from "../storage";
import { employees, locations, employeeMotoRates, employeeMotoPctRates } from "@shared/schema";
import { eq, inArray, asc } from "drizzle-orm";

let EMP_A: number;
let EMP_B: number;
let LOC_1: number;
let LOC_2: number;

async function cleanupRates(emps: number[]) {
  if (emps.length === 0) return;
  await db.delete(employeeMotoRates).where(inArray(employeeMotoRates.employeeId, emps));
  await db.delete(employeeMotoPctRates).where(inArray(employeeMotoPctRates.employeeId, emps));
}

describe("moto-rate storage", () => {
  beforeAll(async () => {
    // Pull the first 2 employees and 2 locations seeded by `npm run seed:dev`.
    const emps = await db.select().from(employees).orderBy(asc(employees.id)).limit(2);
    const locs = await db.select().from(locations).orderBy(asc(locations.id)).limit(2);
    if (emps.length < 2 || locs.length < 2) {
      throw new Error(
        "moto-rate storage tests require at least 2 employees and 2 locations in the DB. " +
        "Run `npm run seed:dev` first.",
      );
    }
    EMP_A = emps[0].id;
    EMP_B = emps[1].id;
    LOC_1 = locs[0].id;
    LOC_2 = locs[1].id;
    await cleanupRates([EMP_A, EMP_B]);
  });

  afterAll(async () => {
    await cleanupRates([EMP_A, EMP_B]);
  });

  describe("replaceEmployeeMotoRates", () => {
    it("inserts rows when the employee has none", async () => {
      const saved = await storage.replaceEmployeeMotoRates(EMP_A, [
        { locationId: LOC_1, rate: "5.50" },
        { locationId: LOC_2, rate: "6.25", sourceCompanyId: 1 },
      ]);
      expect(saved).toHaveLength(2);
      expect(saved.map((r) => r.locationId).sort()).toEqual([LOC_1, LOC_2].sort());

      const fetched = await storage.getEmployeeMotoRates(EMP_A);
      expect(fetched).toHaveLength(2);
    });

    it("replaces all existing rows on subsequent PUT (replace-all semantics)", async () => {
      // Pre-populated by previous test: 2 rows for EMP_A
      const saved = await storage.replaceEmployeeMotoRates(EMP_A, [
        { locationId: LOC_1, rate: "9.99" },
      ]);
      expect(saved).toHaveLength(1);

      const fetched = await storage.getEmployeeMotoRates(EMP_A);
      expect(fetched).toHaveLength(1);
      expect(fetched[0].locationId).toBe(LOC_1);
      expect(fetched[0].rate).toBe("9.9900");
    });

    it("clears all rows when called with an empty array", async () => {
      await storage.replaceEmployeeMotoRates(EMP_A, []);
      const fetched = await storage.getEmployeeMotoRates(EMP_A);
      expect(fetched).toHaveLength(0);
    });

    it("isolates rows by employeeId — saving for EMP_B does not touch EMP_A", async () => {
      await storage.replaceEmployeeMotoRates(EMP_A, [{ locationId: LOC_1, rate: "1.00" }]);
      await storage.replaceEmployeeMotoRates(EMP_B, [
        { locationId: LOC_1, rate: "2.00" },
        { locationId: LOC_2, rate: "3.00" },
      ]);

      const aRates = await storage.getEmployeeMotoRates(EMP_A);
      const bRates = await storage.getEmployeeMotoRates(EMP_B);
      expect(aRates).toHaveLength(1);
      expect(aRates[0].rate).toBe("1.0000");
      expect(bRates).toHaveLength(2);
      expect(bRates.find((r) => r.locationId === LOC_1)?.rate).toBe("2.0000");
    });
  });

  describe("replaceEmployeeMotoPctRates", () => {
    it("inserts, replaces, and clears with the same semantics", async () => {
      const ins = await storage.replaceEmployeeMotoPctRates(EMP_A, [
        { locationId: LOC_1, pct: "2.5", sourceCompanyId: 1 },
        { locationId: LOC_2, pct: "1.75" },
      ]);
      expect(ins).toHaveLength(2);

      const replaced = await storage.replaceEmployeeMotoPctRates(EMP_A, [
        { locationId: LOC_1, pct: "10.00" },
      ]);
      expect(replaced).toHaveLength(1);
      const refetched = await storage.getEmployeeMotoPctRates(EMP_A);
      expect(refetched).toHaveLength(1);
      expect(refetched[0].locationId).toBe(LOC_1);

      await storage.replaceEmployeeMotoPctRates(EMP_A, []);
      const empty = await storage.getEmployeeMotoPctRates(EMP_A);
      expect(empty).toHaveLength(0);
    });

    it("preserves sourceCompanyId when provided, null otherwise", async () => {
      const saved = await storage.replaceEmployeeMotoPctRates(EMP_B, [
        { locationId: LOC_1, pct: "5.0", sourceCompanyId: 1 },
        { locationId: LOC_2, pct: "5.0" },
      ]);
      const withSrc = saved.find((r) => r.locationId === LOC_1);
      const noSrc = saved.find((r) => r.locationId === LOC_2);
      expect(withSrc?.sourceCompanyId).toBe(1);
      expect(noSrc?.sourceCompanyId).toBeNull();
    });
  });
});
