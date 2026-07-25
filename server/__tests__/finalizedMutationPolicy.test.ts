import { describe, expect, it } from "vitest";

import { decideFinalizedVoucherMutation } from "../services/accounting/finalizedMutationPolicy";

describe("finalized voucher mutation policy", () => {
  it("allows draft vouchers to use the existing edit workflow", () => {
    expect(decideFinalizedVoucherMutation({ optional: true, reversedAt: null })).toEqual({
      allowed: true,
    });
  });

  it("requires reversal for finalized vouchers", () => {
    expect(decideFinalizedVoucherMutation({ optional: false, reversedAt: null })).toMatchObject({
      allowed: false,
      code: "FINALIZED_VOUCHER_IMMUTABLE",
    });
  });

  it("blocks further mutation after reversal", () => {
    expect(
      decideFinalizedVoucherMutation({ optional: false, reversedAt: new Date("2026-07-25") }),
    ).toMatchObject({
      allowed: false,
      code: "VOUCHER_ALREADY_REVERSED",
    });
  });
});
