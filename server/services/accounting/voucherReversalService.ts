import type { AccountingStore, PostingResult, VoucherPostingInput } from "./types";
import { AccountingIntegrityError, postVoucherInTransaction } from "./voucherPostingService";

export interface VoucherReversalInput {
  companyId: number;
  voucherId: number;
  voucherNumber: string;
  transactionDate: string;
  reason?: string | null;
  idempotencyKey: string;
  createdBy?: string | null;
}

export class VoucherReversalService {
  constructor(private readonly store: AccountingStore) {}

  reverse(input: VoucherReversalInput): Promise<PostingResult> {
    return this.store.transaction(async (tx) => {
      const original = await tx.loadVoucherForReversal(input.companyId, input.voucherId);
      if (!original) {
        throw new AccountingIntegrityError("Voucher not found", "VOUCHER_NOT_FOUND", 404);
      }
      if (original.voucher.reversedAt) {
        throw new AccountingIntegrityError(
          "Voucher has already been reversed",
          "VOUCHER_ALREADY_REVERSED",
          409,
        );
      }
      if (original.voucher.optional) {
        throw new AccountingIntegrityError(
          "Draft vouchers must be deleted through the draft workflow",
          "DRAFT_REQUIRES_DELETE",
          409,
        );
      }

      const reversalInput: VoucherPostingInput = {
        companyId: input.companyId,
        voucherType: original.voucher.voucherType as VoucherPostingInput["voucherType"],
        voucherNumber: input.voucherNumber,
        transactionDate: input.transactionDate,
        description: input.reason ?? `Reversal of ${original.voucher.voucherNumber}`,
        currency: original.voucher.currency,
        exchangeRate: original.voucher.exchangeRate,
        sourceType: "VOUCHER_REVERSAL",
        sourceId: String(original.voucher.id),
        idempotencyKey: input.idempotencyKey,
        createdBy: input.createdBy,
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
      };

      const reversal = await postVoucherInTransaction(tx, reversalInput, original.voucher.id);
      if (!reversal.duplicate) {
        await tx.markReversed(original.voucher.id, new Date());
      }
      return reversal;
    });
  }
}
