import { createHash } from "node:crypto";

import {
  decimalToScaledInteger,
  normalizeExchangeRate,
  normalizeMoney,
  scaledIntegerToDecimal,
} from "./money";
import type {
  AccountingStore,
  AccountingTransaction,
  PostingEntryInput,
  PostingResult,
  VoucherPostingInput,
} from "./types";

export class AccountingIntegrityError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 422,
  ) {
    super(message);
    this.name = "AccountingIntegrityError";
  }
}

function stableFingerprint(input: VoucherPostingInput): string {
  const normalized = {
    ...input,
    currency: input.currency ?? "USD",
    exchangeRate: normalizeExchangeRate(input.exchangeRate ?? "1"),
    entries: input.entries.map(normalizePostingEntry),
  };
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

export function normalizePostingEntry(entry: PostingEntryInput): PostingEntryInput {
  const currency = (entry.currency ?? "USD").trim().toUpperCase();
  const debitAmount = normalizeMoney(entry.debitAmount);
  const creditAmount = normalizeMoney(entry.creditAmount);
  const exchangeRate = entry.exchangeRate ? normalizeExchangeRate(entry.exchangeRate) : null;
  const foreignAmount = entry.foreignAmount ? normalizeMoney(entry.foreignAmount) : null;
  const baseAmount = normalizeMoney(
    entry.baseAmount ?? (decimalToScaledInteger(debitAmount, 2) > 0n ? debitAmount : creditAmount),
  );

  return {
    ...entry,
    currency,
    debitAmount,
    creditAmount,
    exchangeRate,
    foreignAmount,
    baseAmount,
  };
}

export function validatePostingEntries(entries: PostingEntryInput[]): {
  normalizedEntries: PostingEntryInput[];
  totalAmount: string;
} {
  if (entries.length < 2) {
    throw new AccountingIntegrityError(
      "A posted voucher requires at least two entries",
      "VOUCHER_TOO_FEW_ENTRIES",
    );
  }

  const normalizedEntries = entries.map(normalizePostingEntry);
  let debitTotal = 0n;
  let creditTotal = 0n;
  let debitCount = 0;
  let creditCount = 0;

  normalizedEntries.forEach((entry, index) => {
    const debit = decimalToScaledInteger(entry.debitAmount, 2);
    const credit = decimalToScaledInteger(entry.creditAmount, 2);
    if (debit < 0n || credit < 0n) {
      throw new AccountingIntegrityError(
        `Entry ${index + 1} contains a negative amount`,
        "NEGATIVE_VOUCHER_ENTRY",
      );
    }
    if (debit > 0n && credit > 0n) {
      throw new AccountingIntegrityError(
        `Entry ${index + 1} cannot contain both debit and credit`,
        "TWO_SIDED_VOUCHER_ENTRY",
      );
    }
    if (debit === 0n && credit === 0n) {
      throw new AccountingIntegrityError(
        `Entry ${index + 1} must contain a debit or credit`,
        "ZERO_VALUE_VOUCHER_ENTRY",
      );
    }
    if (
      [
        entry.ledgerAccountId,
        entry.bankAccountId,
        entry.fixedAssetId,
        entry.customerId,
        entry.supplierId,
        entry.employeeId,
      ].every((id) => id == null)
    ) {
      throw new AccountingIntegrityError(
        `Entry ${index + 1} must reference an account`,
        "INVALID_ENTRY_ACCOUNT",
      );
    }
    if (entry.currency !== "USD" && (entry.foreignAmount == null || entry.exchangeRate == null)) {
      throw new AccountingIntegrityError(
        `Entry ${index + 1} is missing historical FX values`,
        "INCOMPLETE_FX_METADATA",
      );
    }
    if (debit > 0n) debitCount += 1;
    if (credit > 0n) creditCount += 1;
    debitTotal += debit;
    creditTotal += credit;
  });

  if (debitCount === 0 || creditCount === 0) {
    throw new AccountingIntegrityError(
      "A posted voucher requires at least one debit and one credit",
      "VOUCHER_MISSING_SIDE",
    );
  }
  if (debitTotal !== creditTotal) {
    throw new AccountingIntegrityError(
      "Total debits must equal total credits",
      "UNBALANCED_VOUCHER",
    );
  }

  return {
    normalizedEntries,
    totalAmount: scaledIntegerToDecimal(debitTotal, 2),
  };
}

function normalizePostingInput(input: VoucherPostingInput): {
  normalizedInput: VoucherPostingInput;
  totalAmount: string;
  fingerprint: string;
} {
  const { normalizedEntries, totalAmount } = validatePostingEntries(input.entries);
  const normalizedInput: VoucherPostingInput = {
    ...input,
    currency: (input.currency ?? "USD").trim().toUpperCase(),
    exchangeRate: normalizeExchangeRate(input.exchangeRate ?? "1"),
    entries: normalizedEntries,
  };
  return {
    normalizedInput,
    totalAmount,
    fingerprint: stableFingerprint(normalizedInput),
  };
}

async function resolveExistingPosting(
  tx: AccountingTransaction,
  input: VoucherPostingInput,
  fingerprint: string,
): Promise<PostingResult | null> {
  if (input.idempotencyKey) {
    const existing = await tx.findByIdempotencyKey(input.companyId, input.idempotencyKey);
    if (existing) {
      if (existing.voucher.idempotencyFingerprint !== fingerprint) {
        throw new AccountingIntegrityError(
          "Idempotency key was already used for a different posting",
          "IDEMPOTENCY_KEY_REUSED",
          409,
        );
      }
      return { ...existing, duplicate: true };
    }
  }

  if (input.sourceType && input.sourceId) {
    const existing = await tx.findBySource(input.companyId, input.sourceType, input.sourceId);
    if (existing) {
      if (existing.voucher.idempotencyFingerprint !== fingerprint) {
        throw new AccountingIntegrityError(
          "Source reference was already used for a different posting",
          "SOURCE_REFERENCE_REUSED",
          409,
        );
      }
      return { ...existing, duplicate: true };
    }
  }

  return null;
}

function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function postVoucherInTransaction(
  tx: AccountingTransaction,
  input: VoucherPostingInput,
  reversalOfVoucherId?: number | null,
): Promise<PostingResult> {
  const { normalizedInput, totalAmount, fingerprint } = normalizePostingInput(input);
  const existing = await resolveExistingPosting(tx, normalizedInput, fingerprint);
  if (existing) return existing;

  const referenceIssues = await tx.validateReferences(
    normalizedInput.companyId,
    normalizedInput.entries,
    normalizedInput.locationId,
  );
  if (referenceIssues.length > 0) {
    throw new AccountingIntegrityError(
      `Posting references do not belong to the selected company: ${referenceIssues.join(", ")}`,
      "COMPANY_ISOLATION_VIOLATION",
      403,
    );
  }

  const voucher = await tx.createVoucher(
    normalizedInput,
    totalAmount,
    fingerprint,
    reversalOfVoucherId,
  );
  const createdEntries = await tx.createEntries(voucher.id, normalizedInput.entries);
  if (!voucher.optional) {
    await tx.applySupportingBalances(normalizedInput.entries, 1);
  }
  return { voucher, entries: createdEntries, duplicate: false };
}

export class VoucherPostingService {
  constructor(private readonly store: AccountingStore) {}

  async post(input: VoucherPostingInput): Promise<PostingResult> {
    try {
      return await this.store.transaction((tx) => postVoucherInTransaction(tx, input));
    } catch (error) {
      if (!isPostgresUniqueViolation(error)) throw error;

      const { normalizedInput, fingerprint } = normalizePostingInput(input);
      const existing = await this.store.transaction((tx) =>
        resolveExistingPosting(tx, normalizedInput, fingerprint),
      );
      if (existing) return existing;
      throw error;
    }
  }
}
