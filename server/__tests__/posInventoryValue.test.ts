import { describe, expect, it } from "vitest";

import { calculateInventoryMovementState } from "../services/accounting/posSaleCorrectionService";

describe("POS inventory value movements", () => {
  it("adds back the persisted historical sale cost instead of the current average", () => {
    expect(calculateInventoryMovementState("10.000", "60.00", "2.000", "8.00")).toEqual({
      quantity: "12.000",
      totalValue: "68.00",
      averageRate: "5.67",
    });
  });

  it("subtracts the corrected sale's recorded cost and returns to the prior state", () => {
    expect(calculateInventoryMovementState("12.000", "68.00", "-2.000", "-8.00")).toEqual({
      quantity: "10.000",
      totalValue: "60.00",
      averageRate: "6.00",
    });
  });

  it("clears residual value when quantity becomes zero", () => {
    expect(calculateInventoryMovementState("2.000", "8.00", "-2.000", "-8.00")).toEqual({
      quantity: "0.000",
      totalValue: "0.00",
      averageRate: "0.00",
    });
  });

  it("rejects inventory states whose quantity and value have opposite signs", () => {
    expect(() => calculateInventoryMovementState("1.000", "5.00", "0.000", "-10.00")).toThrow(
      "Inventory quantity and value have inconsistent signs",
    );
  });
});
