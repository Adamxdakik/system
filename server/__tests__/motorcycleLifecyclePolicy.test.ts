import { describe, expect, it } from "vitest";
import {
  canRegisterAssemblyUnit,
  lifecycleNeedsAttention,
  motorcycleBelongsToCustomer,
  remainingAssemblyUnits,
} from "../services/motorcycles/lifecyclePolicy";

describe("motorcycle lifecycle policy", () => {
  it("keeps customer-scoped lifecycle records on the sold motorcycle owner", () => {
    expect(motorcycleBelongsToCustomer(12, 12)).toBe(true);
    expect(motorcycleBelongsToCustomer(12, 13)).toBe(false);
    expect(motorcycleBelongsToCustomer(null, 12)).toBe(false);
  });

  it("caps individual assembly registrations at completed output quantity", () => {
    expect(remainingAssemblyUnits(3, 0)).toBe(3);
    expect(remainingAssemblyUnits(3, 2)).toBe(1);
    expect(remainingAssemblyUnits(3, 3)).toBe(0);
    expect(remainingAssemblyUnits(-2, 1)).toBe(1);
  });

  it("only registers completed Final Product output with capacity remaining", () => {
    expect(
      canRegisterAssemblyUnit({
        completed: true,
        toStage: "Final Product",
        qtyChanged: 2,
        linkedCount: 1,
      }),
    ).toBe(true);
    expect(
      canRegisterAssemblyUnit({
        completed: false,
        toStage: "Final Product",
        qtyChanged: 2,
        linkedCount: 0,
      }),
    ).toBe(false);
    expect(
      canRegisterAssemblyUnit({
        completed: true,
        toStage: "Painted",
        qtyChanged: 2,
        linkedCount: 0,
      }),
    ).toBe(false);
    expect(
      canRegisterAssemblyUnit({
        completed: true,
        toStage: "Final Product",
        qtyChanged: 2,
        linkedCount: 2,
      }),
    ).toBe(false);
  });

  it("flags operational lifecycle inconsistencies", () => {
    expect(
      lifecycleNeedsAttention({
        status: "IN_SERVICE",
        serviceCount: 0,
        activeWarrantyCount: 0,
        warrantyEndDate: null,
        today: "2026-07-26",
      }),
    ).toBe(true);
    expect(
      lifecycleNeedsAttention({
        status: "SOLD",
        serviceCount: 1,
        activeWarrantyCount: 1,
        warrantyEndDate: "2026-07-25",
        today: "2026-07-26",
      }),
    ).toBe(true);
    expect(
      lifecycleNeedsAttention({
        status: "SOLD",
        serviceCount: 1,
        activeWarrantyCount: 1,
        warrantyEndDate: "2027-07-26",
        today: "2026-07-26",
      }),
    ).toBe(false);
  });
});
