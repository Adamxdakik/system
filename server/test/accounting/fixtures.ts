import type { PostingEntryInput, VoucherPostingInput } from "../../services/accounting/types";

export const ACCOUNTING_FIXTURE = {
  companyId: 91001,
  otherCompanyId: 91002,
  adminUsername: "accounting-admin",
  managerUsername: "accounting-manager",
  posUsername: "accounting-pos",
  debitAccountId: 92001,
  creditAccountId: 92002,
  cashAccountId: 92003,
  bankAccountId: 92004,
  customerId: 93001,
  supplierId: 93002,
  employeeId: 93003,
  locationId: 94001,
  stockItemId: 95001,
  businessDate: "2024-02-29",
  futureDate: "2030-12-31",
  eurRate: "1.23456789",
} as const;

export function balancedEntries(
  amount = "100.00",
  debitAccountId = ACCOUNTING_FIXTURE.debitAccountId,
  creditAccountId = ACCOUNTING_FIXTURE.creditAccountId,
): PostingEntryInput[] {
  return [
    { ledgerAccountId: debitAccountId, debitAmount: amount, creditAmount: "0" },
    { ledgerAccountId: creditAccountId, debitAmount: "0", creditAmount: amount },
  ];
}

export function journalFixture(overrides: Partial<VoucherPostingInput> = {}): VoucherPostingInput {
  return {
    companyId: ACCOUNTING_FIXTURE.companyId,
    voucherType: "Journal",
    voucherNumber: "TEST-JOURNAL-001",
    transactionDate: ACCOUNTING_FIXTURE.businessDate,
    currency: "USD",
    exchangeRate: "1",
    sourceType: "ACCOUNTING_TEST",
    sourceId: "journal-001",
    idempotencyKey: "journal-request-001",
    createdBy: ACCOUNTING_FIXTURE.adminUsername,
    entries: balancedEntries(),
    ...overrides,
  };
}
