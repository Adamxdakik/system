import { createHash } from "node:crypto";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "../../db";
import { employees, ledgerAccounts, vouchers } from "@shared/schema";
import { accountingTransactionFor, type DrizzleTransaction } from "./drizzleAccountingStore";
import { decimalToScaledInteger, normalizeMoney, scaledIntegerToDecimal } from "./money";
import type { PostingEntryInput, PostedVoucher, VoucherType } from "./types";
import { AccountingIntegrityError, postVoucherInTransaction } from "./voucherPostingService";

export type PayrollMovementKind = "deposit" | "bonus" | "withdrawal" | "worker_payment";
export type PayrollPaymentAccountType = "bank" | "cash";

export interface PayrollMovementLine {
  employeeId: number;
  amount: string;
}

export interface PayrollPostingInput {
  companyId: number;
  kind: PayrollMovementKind;
  lines: PayrollMovementLine[];
  transactionDate: string;
  notes?: string | null;
  paymentAccountType?: PayrollPaymentAccountType | null;
  paymentAccountId?: number | null;
  expenseAccountCode?: "SALARY_EXPENSE" | "BONUS_EXPENSE";
  expenseAccountName?: "Salary Expense" | "Bonus Expense";
  voucherType: VoucherType;
  voucherPrefix: string;
  sourceType: string;
  idempotencyKey: string;
  createdBy?: string | null;
}

export interface PayrollEmployeeResult {
  employeeId: number;
  name: string;
  amount: number;
  newBalance: number;
}

export interface PayrollPostingResult {
  voucher: typeof vouchers.$inferSelect;
  employees: PayrollEmployeeResult[];
  totalAmount: number;
  duplicate: boolean;
}

function suffix(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12).toUpperCase();
}

function requirePositiveAmount(value: string): bigint {
  const amount = decimalToScaledInteger(value, 2);
  if (amount <= 0n) {
    throw new AccountingIntegrityError(
      "Payroll amounts must be positive",
      "INVALID_PAYROLL_AMOUNT",
      400,
    );
  }
  return amount;
}

function normalizeLines(lines: PayrollMovementLine[]): Array<PayrollMovementLine & { amountMinor: bigint }> {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new AccountingIntegrityError("At least one payroll line is required", "PAYROLL_LINES_REQUIRED", 400);
  }

  const totals = new Map<number, bigint>();
  for (const line of lines) {
    if (!Number.isInteger(line.employeeId) || line.employeeId <= 0) {
      throw new AccountingIntegrityError("Invalid employee", "INVALID_EMPLOYEE", 400);
    }
    const amount = requirePositiveAmount(line.amount);
    totals.set(line.employeeId, (totals.get(line.employeeId) ?? 0n) + amount);
  }

  return [...totals.entries()].map(([employeeId, amountMinor]) => ({
    employeeId,
    amount: scaledIntegerToDecimal(amountMinor, 2),
    amountMinor,
  }));
}

async function getOrCreateExpenseAccount(
  tx: DrizzleTransaction,
  companyId: number,
  code: "SALARY_EXPENSE" | "BONUS_EXPENSE",
  name: "Salary Expense" | "Bonus Expense",
): Promise<number> {
  const [existing] = await tx
    .select({ id: ledgerAccounts.id })
    .from(ledgerAccounts)
    .where(and(eq(ledgerAccounts.companyId, companyId), eq(ledgerAccounts.code, code)))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await tx
    .insert(ledgerAccounts)
    .values({
      companyId,
      code,
      name,
      accountType: "Expense",
      openingBalance: "0",
      active: true,
    })
    .onConflictDoNothing()
    .returning({ id: ledgerAccounts.id });
  if (created) return created.id;

  const [concurrent] = await tx
    .select({ id: ledgerAccounts.id })
    .from(ledgerAccounts)
    .where(and(eq(ledgerAccounts.companyId, companyId), eq(ledgerAccounts.code, code)))
    .limit(1);
  if (!concurrent) {
    throw new AccountingIntegrityError(
      `Unable to resolve ${code} ledger account`,
      "PAYROLL_EXPENSE_ACCOUNT_UNAVAILABLE",
      409,
    );
  }
  return concurrent.id;
}

function paymentEntry(
  type: PayrollPaymentAccountType,
  id: number,
  debitAmount: string,
  creditAmount: string,
  description: string,
): PostingEntryInput {
  if (!Number.isInteger(id) || id <= 0) {
    throw new AccountingIntegrityError("Payment account is required", "PAYROLL_ACCOUNT_REQUIRED", 400);
  }
  return {
    ledgerAccountId: type === "cash" ? id : null,
    bankAccountId: type === "bank" ? id : null,
    debitAmount,
    creditAmount,
    description,
  };
}

async function loadEmployeesForUpdate(
  tx: DrizzleTransaction,
  companyId: number,
  employeeIds: number[],
): Promise<Map<number, typeof employees.$inferSelect>> {
  const rows = await tx
    .select()
    .from(employees)
    .where(and(eq(employees.companyId, companyId), inArray(employees.id, employeeIds)))
    .for("update");
  const result = new Map(rows.map((row) => [row.id, row]));
  const missing = employeeIds.filter((id) => !result.has(id));
  if (missing.length > 0) {
    throw new AccountingIntegrityError(
      `Employee not found in selected company: ${missing.join(", ")}`,
      "PAYROLL_EMPLOYEE_NOT_FOUND",
      404,
    );
  }
  return result;
}

function buildDescription(input: PayrollPostingInput, employeeCount: number): string {
  if (input.notes?.trim()) return input.notes.trim();
  const noun = input.kind === "bonus" ? "bonus" : input.kind === "withdrawal" ? "withdrawal" : "salary";
  if (input.kind === "worker_payment") {
    return employeeCount === 1 ? "Salary payment" : `Bulk salary payment for ${employeeCount} workers`;
  }
  return employeeCount === 1 ? `${noun[0].toUpperCase()}${noun.slice(1)} posting` : `Bulk ${noun} posting for ${employeeCount} employees`;
}

function resultRows(
  lockedEmployees: Map<number, typeof employees.$inferSelect>,
  lines: Array<PayrollMovementLine & { amountMinor: bigint }>,
  kind: PayrollMovementKind,
): PayrollEmployeeResult[] {
  return lines.map((line) => {
    const employee = lockedEmployees.get(line.employeeId)!;
    const oldBalance = decimalToScaledInteger(employee.currentBalance, 2);
    const newBalance =
      kind === "withdrawal" ? oldBalance - line.amountMinor : kind === "worker_payment" ? oldBalance : oldBalance + line.amountMinor;
    return {
      employeeId: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      amount: Number(line.amount),
      newBalance: Number(scaledIntegerToDecimal(newBalance, 2)),
    };
  });
}

export class PayrollPostingService {
  post(input: PayrollPostingInput): Promise<PayrollPostingResult> {
    const normalizedLines = normalizeLines(input.lines);
    const totalMinor = normalizedLines.reduce((sum, line) => sum + line.amountMinor, 0n);
    const totalAmount = scaledIntegerToDecimal(totalMinor, 2);

    return db.transaction(async (tx) => {
      const accountingTx = accountingTransactionFor(tx);
      const existing = await accountingTx.findByIdempotencyKey(input.companyId, input.idempotencyKey);
      if (existing) {
        const [voucher] = await tx
          .select()
          .from(vouchers)
          .where(eq(vouchers.id, existing.voucher.id))
          .limit(1);
        if (!voucher) {
          throw new AccountingIntegrityError("Payroll voucher not found", "VOUCHER_NOT_FOUND", 404);
        }
        const lockedEmployees = await loadEmployeesForUpdate(
          tx,
          input.companyId,
          normalizedLines.map((line) => line.employeeId),
        );
        return {
          voucher,
          employees: resultRows(lockedEmployees, normalizedLines, "worker_payment"),
          totalAmount: Number(totalAmount),
          duplicate: true,
        };
      }

      const lockedEmployees = await loadEmployeesForUpdate(
        tx,
        input.companyId,
        normalizedLines.map((line) => line.employeeId),
      );

      if (input.kind === "withdrawal") {
        for (const line of normalizedLines) {
          const employee = lockedEmployees.get(line.employeeId)!;
          const balance = decimalToScaledInteger(employee.currentBalance, 2);
          if (balance < line.amountMinor) {
            throw new AccountingIntegrityError(
              `${employee.firstName} ${employee.lastName} has insufficient balance. Balance: ${normalizeMoney(employee.currentBalance)}, requested: ${line.amount}`,
              "INSUFFICIENT_EMPLOYEE_BALANCE",
              409,
            );
          }
        }
      }

      const entries: PostingEntryInput[] = [];
      const description = buildDescription(input, normalizedLines.length);

      if (input.kind === "deposit" || input.kind === "bonus" || input.kind === "worker_payment") {
        const expenseAccountId = await getOrCreateExpenseAccount(
          tx,
          input.companyId,
          input.expenseAccountCode ?? "SALARY_EXPENSE",
          input.expenseAccountName ?? "Salary Expense",
        );
        entries.push({
          ledgerAccountId: expenseAccountId,
          debitAmount: totalAmount,
          creditAmount: "0",
          description,
        });
      }

      if (input.kind === "deposit" || input.kind === "bonus") {
        for (const line of normalizedLines) {
          entries.push({
            employeeId: line.employeeId,
            debitAmount: "0",
            creditAmount: line.amount,
            description,
          });
        }
      } else if (input.kind === "withdrawal") {
        for (const line of normalizedLines) {
          entries.push({
            employeeId: line.employeeId,
            debitAmount: line.amount,
            creditAmount: "0",
            description,
          });
        }
        entries.push(
          paymentEntry(
            input.paymentAccountType ?? "bank",
            Number(input.paymentAccountId),
            "0",
            totalAmount,
            description,
          ),
        );
      } else {
        entries.push(
          paymentEntry(
            input.paymentAccountType ?? "bank",
            Number(input.paymentAccountId),
            "0",
            totalAmount,
            description,
          ),
        );
      }

      const posting = await postVoucherInTransaction(accountingTx, {
        companyId: input.companyId,
        voucherType: input.voucherType,
        voucherNumber: `${input.voucherPrefix}-${suffix(input.idempotencyKey)}`,
        transactionDate: input.transactionDate,
        description,
        currency: "USD",
        exchangeRate: "1",
        sourceType: input.sourceType,
        sourceId: input.idempotencyKey,
        idempotencyKey: input.idempotencyKey,
        createdBy: input.createdBy,
        optional: false,
        entries,
      });

      if (!posting.duplicate && input.kind !== "worker_payment") {
        for (const line of normalizedLines) {
          const employee = lockedEmployees.get(line.employeeId)!;
          if (input.kind === "withdrawal") {
            await tx
              .update(employees)
              .set({
                totalWithdrawals: sql`${employees.totalWithdrawals} + ${line.amount}`,
              })
              .where(and(eq(employees.id, employee.id), eq(employees.companyId, input.companyId)));
          } else {
            await tx
              .update(employees)
              .set({
                totalDeposits: sql`${employees.totalDeposits} + ${line.amount}`,
              })
              .where(and(eq(employees.id, employee.id), eq(employees.companyId, input.companyId)));
          }
        }
      }

      const [voucher] = await tx
        .select()
        .from(vouchers)
        .where(eq(vouchers.id, posting.voucher.id))
        .limit(1);
      if (!voucher) {
        throw new AccountingIntegrityError("Payroll voucher not found", "VOUCHER_NOT_FOUND", 404);
      }

      return {
        voucher,
        employees: resultRows(lockedEmployees, normalizedLines, input.kind),
        totalAmount: Number(totalAmount),
        duplicate: posting.duplicate,
      };
    });
  }
}

export const payrollPostingService = new PayrollPostingService();
