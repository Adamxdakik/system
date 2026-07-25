import { decimalToScaledInteger } from "../../services/accounting/money";
import type { PostedEntry, PostingResult } from "../../services/accounting/types";

export function entryTotals(entries: Pick<PostedEntry, "debitAmount" | "creditAmount">[]): {
  debit: bigint;
  credit: bigint;
} {
  return entries.reduce(
    (total, entry) => ({
      debit: total.debit + decimalToScaledInteger(entry.debitAmount, 2),
      credit: total.credit + decimalToScaledInteger(entry.creditAmount, 2),
    }),
    { debit: 0n, credit: 0n },
  );
}

export function assertBalanced(entries: PostedEntry[]): void {
  if (entries.length < 2) throw new Error("Voucher has fewer than two entries");
  const { debit, credit } = entryTotals(entries);
  if (debit !== credit) throw new Error(`Voucher is unbalanced: ${debit} != ${credit}`);
}

export function assertValidEntryStructure(entries: PostedEntry[]): void {
  for (const entry of entries) {
    const debit = decimalToScaledInteger(entry.debitAmount, 2);
    const credit = decimalToScaledInteger(entry.creditAmount, 2);
    if (debit < 0n || credit < 0n) throw new Error("Voucher contains a negative entry");
    if ((debit > 0n && credit > 0n) || (debit === 0n && credit === 0n)) {
      throw new Error("Voucher contains an invalid one-sided entry");
    }
  }
}

export function assertExactReversal(original: PostingResult, reversal: PostingResult): void {
  if (reversal.voucher.reversalOfVoucherId !== original.voucher.id) {
    throw new Error("Reversal does not link to its original voucher");
  }
  if (original.entries.length !== reversal.entries.length) {
    throw new Error("Reversal entry count differs from original");
  }
  for (let index = 0; index < original.entries.length; index += 1) {
    const before = original.entries[index];
    const after = reversal.entries[index];
    if (
      before.debitAmount !== after.creditAmount ||
      before.creditAmount !== after.debitAmount ||
      before.currency !== after.currency ||
      before.foreignAmount !== after.foreignAmount ||
      before.exchangeRate !== after.exchangeRate ||
      before.baseAmount !== after.baseAmount
    ) {
      throw new Error(`Reversal entry ${index + 1} is not the exact opposite`);
    }
  }
}

export function assertSingleCompany(result: PostingResult, companyId: number): void {
  if (result.voucher.companyId !== companyId) {
    throw new Error("Voucher belongs to the wrong company");
  }
}
