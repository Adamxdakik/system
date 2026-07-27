import { describe, expect, it } from "vitest";

import {
  effectiveVoucherConditions,
  isEffectiveVoucherState,
} from "../services/accounting/effectiveVoucherView";

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
});
