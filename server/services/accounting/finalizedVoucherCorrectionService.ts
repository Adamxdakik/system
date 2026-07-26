import { createHash } from "node:crypto";

import type { AccountingStore, PostingResult, VoucherPostingInput } from "./types";
import { AccountingIntegrityError, postVoucherInTransaction } from "./voucherPostingService";

export interface FinalizedVoucherCorrectionInput {
  companyId: number;
  voucherId: number;
  idempotencyKey: string;
  createdBy?: string | null;
  reason?: string | null;
  replacement: Omit<
    VoucherPostingInput,
    "companyId" | "sourceType" | "sourceId" | "idempotencyKey" | "createdBy"
  >;
}

export interface FinalizedVoucherCorrectionResult {
  originalVoucherId: number;
  reversal: PostingResult;
  replacement: PostingResult;
  duplicate: boolean;
}

function suffix(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12).toUpperCase();
}

export class FinalizedVoucherCorrectionService {
  constructor(private readonly store: AccountingStore) {}

  correct(input: FinalizedVoucherCorrectionInput): Promise<FinalizedVoucherCorrectionResult> {
    const reversalKey = `${input.idempotencyKey}:reversal`;
    const replacementKey = `${input.idempotencyKey}:replacement`;
    const replacementInput: VoucherPostingInput = {
      ...input.replacement,
      companyId: input.companyId,
      sourceType: "VOUCHER_REPLACEMENT",
      sourceId: `${input.voucherId}:${input.idempotencyKey}`,
      idempotencyKey: replacementKey,
      createdBy: input.createdBy,
      optional: false,
    };

    return this.store.transaction(async (tx) => {
      const existingReplacement = await tx.findByIdempotencyKey(input.companyId, replacementKey);
      if (existingReplacement) {
        const validatedReplacement = await postVoucherInTransaction(tx, replacementInput);
        const existingReversal = await tx.findBySource(
          input.companyId,
          "VOUCHER_REVERSAL",
          String(input.voucherId),
        );
        if (!existingReversal) {
          throw new AccountingIntegrityError(
            "Correction replacement exists without its linked reversal",
            "INCOMPLETE_VOUCHER_CORRECTION",
            409,
          );
        }
        return {
          originalVoucherId: input.voucherId,
          reversal: { ...existingReversal, duplicate: true },
          replacement: { ...validatedReplacement, duplicate: true },
          duplicate: true,
        };
      }

      const original = await tx.loadVoucherForReversal(input.companyId, input.voucherId);
      if (!original) {
        throw new AccountingIntegrityError("Voucher not found", "VOUCHER_NOT_FOUND", 404);
      }
      if (original.voucher.optional) {
        throw new AccountingIntegrityError(
          "Draft vouchers must use the draft edit workflow",
          "DRAFT_REQUIRES_EDIT",
          409,
        );
      }
      if (original.voucher.reversedAt) {
        throw new AccountingIntegrityError(
          "Voucher has already been reversed",
          "VOUCHER_ALREADY_REVERSED",
          409,
        );
      }

      // Legacy vouchers created before FX tracking have null currency/exchangeRate.
      // They were implicitly posted in the base currency at a 1:1 rate, so use the
      // same safe fallback already applied to legacy POS corrections.
      if (!original.voucher.currency) original.voucher.currency = "USD";
      if (!original.voucher.exchangeRate) original.voucher.exchangeRate = "1";

      const reversal = await postVoucherInTransaction(
        tx,
        {
          companyId: input.companyId,
          locationId: null,
          voucherType: original.voucher.voucherType as VoucherPostingInput["voucherType"],
          voucherNumber: `${original.voucher.voucherNumber}-REV-${suffix(reversalKey)}`,
          transactionDate: original.voucher.transactionDate,
          description: input.reason ?? `Correction reversal of ${original.voucher.voucherNumber}`,
          currency: original.voucher.currency,
          exchangeRate: original.voucher.exchangeRate,
          sourceType: "VOUCHER_REVERSAL",
          sourceId: String(original.voucher.id),
          idempotencyKey: reversalKey,
          createdBy: input.createdBy,
          optional: false,
          entries: original.entries.map((entry) => ({
            ledgerAccountId: entry.ledgerAccountId,
            bankAccountId: entry.bankAccountId,
            fixedAssetId: entry.fixedAssetId,
            customerId: entry.customerId,
            supplierId: entry.supplierId,
            employeeId: entry.employeeId,
            debitAmount: entry.creditAmount,
            creditAmount: entry.debitAmount,
            description: entry.description,
            currency: entry.currency,
            foreignAmount: entry.foreignAmount,
            exchangeRate: entry.exchangeRate,
            baseAmount: entry.baseAmount,
          })),
        },
        original.voucher.id,
      );

      if (!reversal.duplicate) {
        await tx.markReversed(original.voucher.id, new Date());
      }

      const replacement = await postVoucherInTransaction(tx, replacementInput);

      return {
        originalVoucherId: original.voucher.id,
        reversal,
        replacement,
        duplicate: reversal.duplicate && replacement.duplicate,
      };
    });
  }
}
