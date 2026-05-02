/**
 * Authenticated tenant-boundary regression tests for the moto-rate endpoints.
 *
 * Logs in as `admin` (created by `npm run seed:dev`), captures the session
 * cookie, then exercises the 403/404 paths for cross-tenant references:
 *   - employee in a company the user has no role on  → 404
 *   - locationId from another company                 → 403 (locationId guard)
 *   - sourceCompanyId from another company            → 403 (sourceCompanyId guard)
 *   - happy path with all-valid IDs                   → 200
 *
 * Requires:
 *   - dev workflow running on http://localhost:5000
 *   - `npm run seed:dev` has been executed
 */

import { describe, it, expect, beforeAll } from "vitest";
import { db } from "../db";
import { companies, locations, employees, userCompanyRoles } from "@shared/schema";
import { eq } from "drizzle-orm";

// Session cookies are `secure: true` on Replit (REPL_ID is set), so Express only
// emits Set-Cookie over HTTPS. Use $REPLIT_DEV_DOMAIN (HTTPS via the platform
// proxy) instead of localhost. Falls back to localhost for non-Replit dev envs.
const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://localhost:5000";

let cookie = "";
let mainCompanyId: number;
let mainEmployeeId: number;
let mainLocationId: number;
let otherCompanyId: number;
let otherEmployeeId: number;
let otherLocationId: number;

async function login(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin" }),
  });
  if (res.status !== 200) {
    const body = await res.text();
    throw new Error(`login failed: ${res.status} ${body}`);
  }
  // Use getSetCookie() (Node 20+) for proper multi-cookie parsing; fall back to
  // the single-header path for older runtimes.
  const all = (res.headers as any).getSetCookie?.() ?? [res.headers.get("set-cookie")].filter(Boolean);
  if (!all.length) throw new Error(`no Set-Cookie on login response (status=${res.status})`);
  // Pick the session cookie specifically and strip attributes.
  const session = all.find((c: string) => c.startsWith("erp.session=")) ?? all[0];
  return session.split(";")[0];
}

describe("moto-rates authed tenant boundaries", () => {
  beforeAll(async () => {
    cookie = await login();

    const [main] = await db.select().from(companies).where(eq(companies.code, "MAIN"));
    const [other] = await db.select().from(companies).where(eq(companies.code, "OTHER"));
    if (!main || !other) {
      throw new Error("Seed data missing — run `npm run seed:dev` first.");
    }
    mainCompanyId = main.id;
    otherCompanyId = other.id;

    const [mainEmp] = await db.select().from(employees).where(eq(employees.companyId, mainCompanyId)).limit(1);
    const [otherEmp] = await db.select().from(employees).where(eq(employees.companyId, otherCompanyId)).limit(1);
    const [mainLoc] = await db.select().from(locations).where(eq(locations.companyId, mainCompanyId)).limit(1);
    const [otherLoc] = await db.select().from(locations).where(eq(locations.companyId, otherCompanyId)).limit(1);
    if (!mainEmp || !otherEmp || !mainLoc || !otherLoc) {
      throw new Error("Seed data incomplete — run `npm run seed:dev` first.");
    }
    mainEmployeeId = mainEmp.id;
    otherEmployeeId = otherEmp.id;
    mainLocationId = mainLoc.id;
    otherLocationId = otherLoc.id;

    // Sanity: admin must have a role on MAIN and NOT on OTHER.
    const adminRoles = await db.select().from(userCompanyRoles);
    const onMain = adminRoles.some((r) => r.companyId === mainCompanyId);
    const onOther = adminRoles.some((r) => r.companyId === otherCompanyId);
    if (!onMain) throw new Error("admin has no role on MAIN — run `npm run seed:dev`.");
    if (onOther) {
      throw new Error(
        "admin has a role on OTHER, which would invalidate cross-tenant tests. " +
        "Reset by deleting that user_company_roles row.",
      );
    }
  });

  async function putRates(employeeId: number, body: any) {
    return fetch(`${BASE_URL}/api/employees/${employeeId}/moto-rates`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
    });
  }
  async function putPctRates(employeeId: number, body: any) {
    return fetch(`${BASE_URL}/api/employees/${employeeId}/moto-pct-rates`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
    });
  }
  async function getRates(employeeId: number) {
    return fetch(`${BASE_URL}/api/employees/${employeeId}/moto-rates`, {
      headers: { cookie },
    });
  }

  it("PUT /moto-rates rejects employee from another company with 404", async () => {
    const res = await putRates(otherEmployeeId, { rates: [{ locationId: mainLocationId, rate: "1.00" }] });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toMatch(/employee not found/i);
  });

  it("GET /moto-rates rejects employee from another company with 404", async () => {
    const res = await getRates(otherEmployeeId);
    expect(res.status).toBe(404);
  });

  it("PUT /moto-rates rejects locationId from another company with 403", async () => {
    const res = await putRates(mainEmployeeId, {
      rates: [{ locationId: otherLocationId, rate: "1.00" }],
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toMatch(/locationid.*does not belong/i);
  });

  it("PUT /moto-pct-rates rejects locationId from another company with 403", async () => {
    const res = await putPctRates(mainEmployeeId, {
      rates: [{ locationId: otherLocationId, pct: "5.0" }],
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toMatch(/locationid.*does not belong/i);
  });

  it("PUT /moto-rates rejects sourceCompanyId user has no access to with 403", async () => {
    const res = await putRates(mainEmployeeId, {
      rates: [{ locationId: mainLocationId, rate: "1.00", sourceCompanyId: otherCompanyId }],
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toMatch(/sourcecompanyid.*not in your accessible/i);
  });

  it("PUT /moto-rates with all-valid IDs returns 200 (happy path)", async () => {
    const res = await putRates(mainEmployeeId, {
      rates: [
        { locationId: mainLocationId, rate: "7.50", sourceCompanyId: mainCompanyId },
      ],
    });
    if (res.status !== 200) {
      const body = await res.text();
      throw new Error(`expected 200, got ${res.status}: ${body}`);
    }
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].locationId).toBe(mainLocationId);
    expect(body[0].sourceCompanyId).toBe(mainCompanyId);
  });

  it("PUT /moto-rates clears all rows when called with empty array (200)", async () => {
    const res = await putRates(mainEmployeeId, { rates: [] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  // -------- T02: Zod validation --------
  it("PUT /moto-rates rejects rate=0 with 400 (Zod bound check)", async () => {
    const res = await putRates(mainEmployeeId, {
      rates: [{ locationId: mainLocationId, rate: "0" }],
    });
    expect(res.status).toBe(400);
  });

  it("PUT /moto-rates rejects rate=99999 with 400 (Zod bound check)", async () => {
    const res = await putRates(mainEmployeeId, {
      rates: [{ locationId: mainLocationId, rate: "99999" }],
    });
    expect(res.status).toBe(400);
  });

  it("PUT /moto-rates rejects malformed numeric rate=\"1abc\" with 400 (strict parser)", async () => {
    const res = await putRates(mainEmployeeId, {
      rates: [{ locationId: mainLocationId, rate: "1abc" }],
    });
    expect(res.status).toBe(400);
  });

  // -------- T05: copy-from --------
  it("POST /moto-rates/copy-from copies live rows from source to target", async () => {
    // Seed source (mainEmployee) with one rate
    await putRates(mainEmployeeId, { rates: [{ locationId: mainLocationId, rate: "9.99" }] });
    // Find a second employee in MAIN to copy to. If only one exists, skip gracefully.
    const all = await db.select().from(employees).where(eq(employees.companyId, mainCompanyId));
    const target = all.find((e) => e.id !== mainEmployeeId);
    if (!target) return; // single-employee dev seed; skip
    const res = await fetch(`${BASE_URL}/api/employees/${target.id}/moto-rates/copy-from/${mainEmployeeId}`, {
      method: "POST",
      headers: { cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.copied).toBe(1);
    expect(body.rates[0].rate).toBe("9.9900");
  });

  // -------- T06: bulk-set --------
  it("POST /locations/:id/moto-rates/bulk-set updates rates for many employees", async () => {
    const all = await db.select().from(employees).where(eq(employees.companyId, mainCompanyId));
    const ids = all.map((e) => e.id).slice(0, 2);
    const res = await fetch(`${BASE_URL}/api/locations/${mainLocationId}/moto-rates/bulk-set`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ rate: "5.55", employeeIds: ids }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(ids.length);
  });

  it("POST /locations/:id/moto-rates/bulk-set rejects cross-tenant location with 403", async () => {
    const res = await fetch(`${BASE_URL}/api/locations/${otherLocationId}/moto-rates/bulk-set`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ rate: "5.55", employeeIds: [mainEmployeeId] }),
    });
    expect(res.status).toBe(403);
  });

  // -------- T04: audit log --------
  it("GET /moto-rate-audit returns rows after rate changes", async () => {
    const res = await fetch(`${BASE_URL}/api/employees/${mainEmployeeId}/moto-rate-audit`, {
      headers: { cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("action");
    expect(body[0]).toHaveProperty("tableName");
  });

  // -------- T07: CSV export --------
  it("GET /companies/:id/moto-rates/export.csv returns CSV with proper header", async () => {
    const res = await fetch(`${BASE_URL}/api/companies/${mainCompanyId}/moto-rates/export.csv`, {
      headers: { cookie },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    expect(res.headers.get("content-disposition")).toMatch(/attachment/);
    const body = await res.text();
    expect(body.split("\n")[0]).toBe("employee_code,employee_name,location_code,location_name,rate,pct");
  });

  it("GET /companies/:id/moto-rates/export.csv rejects cross-tenant company with 403", async () => {
    const res = await fetch(`${BASE_URL}/api/companies/${otherCompanyId}/moto-rates/export.csv`, {
      headers: { cookie },
    });
    expect(res.status).toBe(403);
  });

  // -------- T10: health --------
  it("GET /api/health returns ok with db status (no auth required)", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("ok");
    expect(typeof body.uptimeSeconds).toBe("number");
  });
});
