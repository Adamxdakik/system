import { createHash } from "node:crypto";
import { and, count, eq } from "drizzle-orm";

import { db } from "../../db";
import {
  employees,
  ledgerAccounts,
  salaryAdvanceDeductions,
  salaryAdvances,
} from "@shared/schema";
import { accountingTransactionFor } from "./drizzleAccountingStore";
import { decimalToScaledInteger, normalizeMoney } from "./money";
import type { PostingResult } from "./types";
import { AccountingIntegrityError, postVoucherInTransaction } from "./voucherPostingService";

export interface CreateSalaryAdvanceInput {
  companyId: number;
  employeeId: number;
  advanceDate: string;
  amount: string;
  cashAccountId: number;
  notes?: string | null;
  idempotencyKey: string;
  createdBy?: string | null;
}

export interface CancelSalaryAdvanceInput {
  companyId: number;
  salaryAdvanceId: number;
  idempotencyKey: string;
  createdBy?: string | null;
  reason?: string | null;
}

export interface SalaryAdvanceCreationResult {
  advance: typeof salaryAdvances.$inferSelect;
  voucher: PostingResult;
  duplicate: boolean;
}

export interface SalaryAdvanceCancellationResult {
  advance: typeof salaryAdvances.$inferSelect;
  reversal: PostingResult;
  duplicate: boolean;
}

function suffix(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16).toUpperCase();
}

function reversalEntries(entries: PostingResult["entries"]) {
  return entries.map((entry) => ({
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
  }));
}

export class SalaryAdvanceService {
  create(input: CreateSalaryAdvanceInput): Promise<SalaryAdvanceCreationResult> {
    const amount = normalizeMoney(input.amount);
    if (decimalToScaledInteger(amount, 2) <= 0n) {
      throw new AccountingIntegrityError(
        "Salary advance amount must be positive",
        "INVALID_SALARY_ADVANCE_AMOUNT",
      );
    }

    return db.transaction(async (tx) => {
      const accountingTx = accountingTransactionFor(tx);
      const existing = await accountingTx.findByIdempotencyKey(
        input.companyId,
        input.idempotencyKey,
      );
      if (existing) {
        const [advance] = await tx
          .select()
          .from(salaryAdvances)
          .where(eq(salaryAdvances.voucherId, existing.voucher.id))
          .limit(1);
        if (!advance) {
          throw new AccountingIntegrityError(
            "Salary-advance voucher exists without its source record",
            "INCOMPLETE_SALARY_ADVANCE",
            409,
          );
        }
        return { advance, voucher: { ...existing, duplicate: true }, duplicate: true };
      }

      const [employee] = await tx
        .select()
        .from(employees)
        .where(and(eq(employees.id, input.employeeId), eq(employees.companyId, input.companyId)))
        .limit(1);
      if (!employee) {
        throw new AccountingIntegrityError(
          "Employee not found in the selected company",
          "EMPLOYEE_NOT_FOUND",
          404,
        );
      }
      const [cashAccount] = await tx
        .select()
        .from(ledgerAccounts)
        .where(
          and(
            eq(ledgerAccounts.id, input.cashAccountId),
            eq(ledgerAccounts.companyId, input.companyId),
          ),
        )
        .limit(1);
      if (!cashAccount) {
        throw new AccountingIntegrityError(
          "Cash account not found in the selected company",
          "CASH_ACCOUNT_NOT_FOUND",
          404,
        );
      }

      const posting = await postVoucherInTransaction(accountingTx, {
        companyId: input.companyId,
        voucherType: "Payment",
        voucherNumber: `SA-${suffix(input.idempotencyKey)}`,
        transactionDate: input.advanceDate,
        description:
          input.notes ?? `Salary advance for ${employee.firstName} ${employee.lastName}`,
        currency: "USD",
        exchangeRate: "1",
        sourceType: "SALARY_ADVANCE",
        sourceId: input.idempotencyKey,
        idempotencyKey: input.idempotencyKey,
        createdBy: input.createdBy,
        optional: false,
        entries: [
          {
            employeeId: employee.id,
            debitAmount: amount,
            creditAmount: "0",
            description: `Salary advance - ${input.advanceDate}`,
            currency: "USD",
            exchangeRate: "1",
            baseAmount: amount,
          },
          {
            ledgerAccountId: cashAccount.id,
            debitAmount: "0",
            creditAmount: amount,
            description: `Salary advance - ${input.advanceDate}`,
            currency: "USD",
            exchangeRate: "1",
            baseAmount: amount,
          },
        ],
      });

      const [advance] = await tx
        .insert(salaryAdvances)
        .values({
          companyId: input.companyId,
          employeeId: employee.id,
          advanceDate: input.advanceDate,
          amount,
          remainingBalance: amount,
          voucherId: posting.voucher.id,
          notes: input.notes,
          fullyPaid: false,
        })
        .returning();
      return { advance, voucher: posting, duplicate: posting.duplicate };
    });
  }

  cancel(input: CancelSalaryAdvanceInput): Promise<SalaryAdvanceCancellationResult> {
    const reversalKey = `${input.idempotencyKey}:reversal`;
    return db.transaction(async (tx) => {
      const accountingTx = accountingTransactionFor(tx);
      const [advance] = await tx
        .select()
        .from(salaryAdvances)
        .where(
          and(
            eq(salaryAdvances.id, input.salaryAdvanceId),
            eq(salaryAdvances.companyId, input.companyId),
          ),
        )
        .for("update")
        .limit(1);
      if (!advance) {
        throw new AccountingIntegrityError(
          "Salary advance not found",
          "SALARY_ADVANCE_NOT_FOUND",
          404,
        );
      }

      if (advance.cancelledAt) {
        if (!advance.cancellationVoucherId) {
          throw new AccountingIntegrityError(
            "Cancelled salary advance has no reversal voucher",
            "INCOMPLETE_SALARY_ADVANCE_CANCELLATION",
            409,
          );
        }
        const existing = await accountingTx.loadVoucherForReversal(
          input.companyId,
          advance.cancellationVoucherId,
        );
        if (!existing) {
          throw new AccountingIntegrityError(
            "Salary-advance reversal voucher was not found",
            "INCOMPLETE_SALARY_ADVANCE_CANCELLATION",
            409,
          );
        }
        return { advance, reversal: { ...existing, duplicate: true }, duplicate: true };
      }

      const [{ deductionCount }] = await tx
        .select({ deductionCount: count() })
        .from(salaryAdvanceDeductions)
        .where(eq(salaryAdvanceDeductions.salaryAdvanceId, advance.id));
      if (deductionCount > 0 || advance.fullyPaid || advance.remainingBalance !== advance.amount) {
        throw new AccountingIntegrityError(
          "A salary advance with deductions cannot be cancelled; reverse the payroll deduction first",
          "SALARY_ADVANCE_HAS_DEDUCTIONS",
          409,
        );
      }
      if (!advance.voucherId) {
        throw new AccountingIntegrityError(
          "Salary advance has no linked voucher",
          "SALARY_ADVANCE_VOUCHER_NOT_FOUND",
          409,
        );
      }

      const original = await accountingTx.loadVoucherForReversal(input.companyId, advance.voucherId);
      if (!original) {
        throw new AccountingIntegrityError(
          "Salary-advance voucher not found",
          "SALARY_ADVANCE_VOUCHER_NOT_FOUND",
          404,
        );
      }
      if (original.voucher.reversedAt) {
        throw new AccountingIntegrityError(
          "Salary-advance voucher has already been reversed",
          "VOUCHER_ALREADY_REVERSED",
          409,
        );
      }
      if (!original.voucher.currency || !original.voucher.exchangeRate) {
        throw new AccountingIntegrityError(
          "Salary-advance cancellation requires confirmed historical FX metadata",
          "UNRESOLVED_LEGACY_FX",
          409,
        );
      }

      const reversal = await postVoucherInTransaction(
        accountingTx,
        {
          companyId: input.companyId,
          voucherType: "Payment",
          voucherNumber: `${original.voucher.voucherNumber}-REV-${suffix(reversalKey)}`,
          transactionDate: original.voucher.transactionDate,
          description: input.reason ?? `Cancellation of salary advance ${advance.id}`,
          currency: original.voucher.currency,
          exchangeRate: original.voucher.exchangeRate,
          sourceType: "SALARY_ADVANCE_CANCELLATION",
          sourceId: String(advance.id),
          idempotencyKey: reversalKey,
          createdBy: input.createdBy,
          optional: false,
          entries: reversalEntries(original.entries),
        },
        original.voucher.id,
      );
      if (!reversal.duplicate) {
        await accountingTx.markReversed(original.voucher.id, new Date());
      }

      const [cancelled] = await tx
        .update(salaryAdvances)
        .set({
          cancelledAt: new Date(),
          cancelledBy: input.createdBy,
          cancellationVoucherId: reversal.voucher.id,
        })
        .where(eq(salaryAdvances.id, advance.id))
        .returning();
      return { advance: cancelled, reversal, duplicate: reversal.duplicate };
    });
  }
}
