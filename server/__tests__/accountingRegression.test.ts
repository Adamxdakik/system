import { describe, expect, it } from "vitest";

import { decimalToScaledInteger } from "../services/accounting/money";
import type { PostedEntry, PostingResult } from "../services/accounting/types";
import { ACCOUNTING_FIXTURE, balancedEntries, journalFixture } from "../test/accounting/fixtures";
import {
  assertBalanced,
  assertExactReversal,
  assertSingleCompany,
  assertValidEntryStructure,
  entryTotals,
} from "../test/accounting/invariants";

function postedEntries(amounts: Array<[string, string]>): PostedEntry[] {
  return amounts.map(([debitAmount, creditAmount], index) => ({
    id: index + 1,
    voucherId: 1,
    ledgerAccountId: index + 1,
    debitAmount,
    creditAmount,
    currency: "USD",
    foreignAmount: null,
    exchangeRate: null,
    baseAmount: debitAmount !== "0" ? debitAmount : creditAmount,
  }));
}

function result(
  id: number,
  entries: PostedEntry[],
  reversalOfVoucherId: number | null,
): PostingResult {
  return {
    voucher: {
      id,
      companyId: ACCOUNTING_FIXTURE.companyId,
      voucherNumber: `TEST-${id}`,
      voucherType: "Journal",
      transactionDate: ACCOUNTING_FIXTURE.businessDate,
      currency: "USD",
      exchangeRate: "1.00000000",
      sourceType: "ACCOUNTING_TEST",
      sourceId: String(id),
      idempotencyKey: String(id),
      idempotencyFingerprint: "fixture",
      optional: false,
      reversalOfVoucherId,
      reversedAt: null,
    },
    entries,
    duplicate: false,
  };
}

describe("reusable accounting invariants", () => {
  it("accepts a balanced multi-entry voucher", () => {
    const entries = postedEntries([
      ["75.25", "0"],
      ["24.75", "0"],
      ["0", "60.00"],
      ["0", "40.00"],
    ]);
    expect(() => assertBalanced(entries)).not.toThrow();
    expect(entryTotals(entries)).toEqual({ debit: 10000n, credit: 10000n });
  });

  it("rejects an unbalanced voucher", () => {
    expect(() =>
      assertBalanced(
        postedEntries([
          ["10.00", "0"],
          ["0", "9.99"],
        ]),
      ),
    ).toThrow("unbalanced");
  });

  it.each([
    { amounts: [["-1.00", "0"]] },
    { amounts: [["0", "-1.00"]] },
    { amounts: [["1.00", "1.00"]] },
    { amounts: [["0", "0"]] },
  ] as Array<{ amounts: Array<[string, string]> }>)(
    "rejects invalid entry structure %#",
    ({ amounts }) => {
      expect(() => assertValidEntryStructure(postedEntries(amounts))).toThrow();
    },
  );

  it("proves an exact linked reversal", () => {
    const original = result(
      1,
      postedEntries([
        ["10.00", "0"],
        ["0", "10.00"],
      ]),
      null,
    );
    const reversedEntries = original.entries.map((entry, index) => ({
      ...entry,
      id: index + 10,
      voucherId: 2,
      debitAmount: entry.creditAmount,
      creditAmount: entry.debitAmount,
    }));
    expect(() => assertExactReversal(original, result(2, reversedEntries, 1))).not.toThrow();
  });

  it("rejects a reversal with altered historical FX", () => {
    const originalEntries = postedEntries([
      ["12.35", "0"],
      ["0", "12.35"],
    ]).map((entry) => ({
      ...entry,
      currency: "EUR",
      foreignAmount: "10.00",
      exchangeRate: ACCOUNTING_FIXTURE.eurRate,
      baseAmount: "12.35",
    }));
    const changedRateEntries = originalEntries.map((entry) => ({
      ...entry,
      debitAmount: entry.creditAmount,
      creditAmount: entry.debitAmount,
      exchangeRate: "9.00000000",
    }));
    expect(() =>
      assertExactReversal(result(1, originalEntries, null), result(2, changedRateEntries, 1)),
    ).toThrow("exact opposite");
  });

  it("detects company leakage", () => {
    const posting = result(
      1,
      postedEntries([
        ["1", "0"],
        ["0", "1"],
      ]),
      null,
    );
    expect(() => assertSingleCompany(posting, ACCOUNTING_FIXTURE.otherCompanyId)).toThrow(
      "wrong company",
    );
  });
});

describe("deterministic golden fixture", () => {
  it("contains non-production actors and account identities", () => {
    expect(ACCOUNTING_FIXTURE.adminUsername).toContain("accounting-");
    expect(ACCOUNTING_FIXTURE.managerUsername).toContain("accounting-");
    expect(ACCOUNTING_FIXTURE.posUsername).toContain("accounting-");
    expect(
      new Set([ACCOUNTING_FIXTURE.debitAccountId, ACCOUNTING_FIXTURE.creditAccountId]).size,
    ).toBe(2);
  });

  it("builds a stable backdated journal with a retry key", () => {
    const fixture = journalFixture();
    expect(fixture.transactionDate).toBe("2024-02-29");
    expect(fixture.idempotencyKey).toBe("journal-request-001");
    expect(balancedEntries("0.10")[0].debitAmount).toBe("0.10");
  });

  it("generates bounded balanced examples at database precision", () => {
    for (let minor = 1; minor <= 100; minor += 7) {
      const amount = `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
      const entries = balancedEntries(amount);
      expect(decimalToScaledInteger(entries[0].debitAmount, 2)).toBe(
        decimalToScaledInteger(entries[1].creditAmount, 2),
      );
    }
  });
});
