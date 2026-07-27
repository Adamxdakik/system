import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  effectiveVoucherConditions,
  isEffectiveVoucherState,
} from "../services/accounting/effectiveVoucherView";

const routesSource = readFileSync(new URL("../routes.ts", import.meta.url), "utf8");

function routeSection(startMarker: string, endMarker: string): string {
  const start = routesSource.indexOf(startMarker);
  const end = routesSource.indexOf(endMarker, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return routesSource.slice(start, end);
}

describe("effective voucher operational view", () => {
  it("keeps a current voucher visible", () => {
    expect(
      isEffectiveVoucherState({
        deletedAt: null,
        reversedAt: null,
        reversalOfVoucherId: null,
      }),
    ).toBe(true);
  });

  it.each([
    {
      name: "soft-deleted voucher",
      state: { deletedAt: new Date(), reversedAt: null, reversalOfVoucherId: null },
    },
    {
      name: "superseded original",
      state: { deletedAt: null, reversedAt: new Date(), reversalOfVoucherId: null },
    },
    {
      name: "linked reversal audit row",
      state: { deletedAt: null, reversedAt: null, reversalOfVoucherId: 10 },
    },
  ])("hides $name", ({ state }) => {
    expect(isEffectiveVoucherState(state)).toBe(false);
  });

  it("builds all three lifecycle SQL guards", () => {
    expect(effectiveVoucherConditions()).toHaveLength(3);
  });

  it("keeps the post-Program 6 route additions inside the TypeScript return baseline", () => {
    expect(routesSource).toContain(
      "let container: Awaited<ReturnType<typeof storage.createContainer>>;",
    );

    const routes = [
      routeSection('app.post("/api/containers/import-po"', "// Create a manual container"),
      routeSection('app.patch("/api/containers/:id",', "// Get container items"),
      routeSection(
        'app.get("/api/stats/net-profit-detail"',
        "// Get monthly sales and profit data for Dashboard charts",
      ),
    ];

    for (const route of routes) {
      expect(route).toContain("return res.json(");
      expect(route).toContain("return res.status(500).json(");
    }
  });
});
