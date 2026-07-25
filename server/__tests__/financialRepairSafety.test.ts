import { describe, expect, it } from "vitest";

import { createToken, parseOptions, verifyToken } from "../../scripts/repair-financial-integrity";

describe("controlled financial repair safety", () => {
  it("defaults to dry-run and requires explicit categories and company", () => {
    const options = parseOptions([
      "--company-id",
      "42",
      "--categories",
      "rebuild-employee-balances",
    ]);
    expect(options).toMatchObject({
      companyId: 42,
      categories: ["rebuild-employee-balances"],
      apply: false,
    });
  });

  it("rejects missing company scope", () => {
    expect(() => parseOptions(["--categories", "rebuild-employee-balances"])).toThrow(
      "--company-id is required",
    );
  });

  it("rejects unsupported or ambiguous repair categories", () => {
    expect(() => parseOptions(["--company-id", "42", "--categories", "balance-vouchers"])).toThrow(
      "--categories must contain only",
    );
  });

  it("generates a category- and company-bound confirmation token", () => {
    const secret = "test-only-secret-that-is-at-least-32-characters";
    const employeeToken = createToken(
      { companyId: 42, categories: ["rebuild-employee-balances"] },
      secret,
    );
    const reversalToken = createToken(
      { companyId: 42, categories: ["restore-reversal-flags"] },
      secret,
    );
    expect(employeeToken).toHaveLength(64);
    expect(employeeToken).not.toBe(reversalToken);
    expect(verifyToken(employeeToken, employeeToken)).toBe(true);
    expect(verifyToken(employeeToken, reversalToken)).toBe(false);
  });
});
