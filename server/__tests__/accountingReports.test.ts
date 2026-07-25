import { describe, expect, it } from "vitest";

import {
  aggregateDaybook,
  incomeStatement,
  netPosition,
  trialBalanceDifference,
} from "../financialAuditCore";

const FINALIZED_AND_REVERSED = [
  { debitAmount: "125.00", creditAmount: "0", accountType: "Expense" },
  { debitAmount: "0", creditAmount: "125.00", accountType: "Income" },
  { debitAmount: "0", creditAmount: "125.00", accountType: "Expense" },
  { debitAmount: "125.00", creditAmount: "0", accountType: "Income" },
];

describe("accounting report reconciliation", () => {
  it("daybook totals equal authoritative entries", () => {
    expect(aggregateDaybook(FINALIZED_AND_REVERSED)).toEqual({
      debitMinor: 25000n,
      creditMinor: 25000n,
    });
  });

  it("trial balance remains balanced after reversal", () => {
    expect(trialBalanceDifference(FINALIZED_AND_REVERSED)).toBe(0n);
  });

  it("income statement nets an exact reversal to zero", () => {
    expect(incomeStatement(FINALIZED_AND_REVERSED).netIncomeMinor).toBe(0n);
  });

  it("net position does not double-count a reversed effect", () => {
    expect(netPosition(FINALIZED_AND_REVERSED)).toBe(0n);
  });

  it("uses exact decimal arithmetic for fractional amounts", () => {
    const entries = [
      { debitAmount: "0.10", creditAmount: "0", accountType: "Expense" },
      { debitAmount: "0.20", creditAmount: "0", accountType: "Expense" },
      { debitAmount: "0", creditAmount: "0.30", accountType: "Income" },
    ];
    expect(trialBalanceDifference(entries)).toBe(0n);
    expect(aggregateDaybook(entries)).toEqual({ debitMinor: 30n, creditMinor: 30n });
  });
});
