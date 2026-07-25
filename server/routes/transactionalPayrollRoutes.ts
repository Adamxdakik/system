import { createHash } from "node:crypto";

import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";

import { requireAuth, requireNonPOS } from "../auth";
import { db } from "../db";
import { employees } from "@shared/schema";
import {
  payrollPostingService,
  type PayrollMovementLine,
  type PayrollPaymentAccountType,
} from "../services/accounting/payrollPostingService";
import { AccountingIntegrityError } from "../services/accounting/voucherPostingService";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function idempotencyKey(req: Request, operation: string, payload: unknown): string {
  const explicit =
    (typeof req.body?.idempotencyKey === "string" && req.body.idempotencyKey.trim()) ||
    (typeof req.get("Idempotency-Key") === "string" && req.get("Idempotency-Key")!.trim());
  if (explicit) return `PAYROLL:${operation}:${explicit}`;
  const digest = createHash("sha256").update(canonical(payload)).digest("hex");
  return `PAYROLL:${operation}:${digest}`;
}

function companyId(req: Request): number {
  const id = req.session.currentCompanyId;
  if (!id) throw new AccountingIntegrityError("No company selected", "COMPANY_REQUIRED", 400);
  return id;
}

function userId(req: Request): string | null {
  const user = req.user as { id?: unknown } | undefined;
  return typeof user?.id === "string" ? user.id : null;
}

function requireDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AccountingIntegrityError("Date is required in YYYY-MM-DD format", "PAYROLL_DATE_REQUIRED", 400);
  }
  return value;
}

function line(employeeIdValue: unknown, amountValue: unknown): PayrollMovementLine {
  const employeeId = Number(employeeIdValue);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    throw new AccountingIntegrityError("Employee is required", "INVALID_EMPLOYEE", 400);
  }
  if (amountValue == null || String(amountValue).trim() === "") {
    throw new AccountingIntegrityError("Amount is required", "INVALID_PAYROLL_AMOUNT", 400);
  }
  return { employeeId, amount: String(amountValue) };
}

function lines(value: unknown, emptyMessage: string, filterInvalid = false): PayrollMovementLine[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AccountingIntegrityError(emptyMessage, "PAYROLL_LINES_REQUIRED", 400);
  }
  const result: PayrollMovementLine[] = [];
  for (const item of value) {
    try {
      result.push(line(item?.employeeId, item?.amount));
    } catch (error) {
      if (!filterInvalid) throw error;
    }
  }
  if (result.length === 0) {
    throw new AccountingIntegrityError(emptyMessage, "PAYROLL_LINES_REQUIRED", 400);
  }
  return result;
}

function paymentAccount(req: Request, requireExplicitType = false): {
  type: PayrollPaymentAccountType;
  id: number;
} {
  const rawType = req.body.paymentAccountType;
  const type: PayrollPaymentAccountType = rawType === "cash" ? "cash" : "bank";
  if (requireExplicitType && rawType !== "cash" && rawType !== "bank") {
    throw new AccountingIntegrityError(
      "Date, account type, and account are required",
      "PAYROLL_ACCOUNT_REQUIRED",
      400,
    );
  }
  const id = Number(req.body.paymentAccountId ?? req.body.bankAccountId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AccountingIntegrityError("Payment account is required", "PAYROLL_ACCOUNT_REQUIRED", 400);
  }
  return { type, id };
}

async function employeeRow(company: number, employeeId: number) {
  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.companyId, company)))
    .limit(1);
  if (!employee) {
    throw new AccountingIntegrityError("Employee not found", "PAYROLL_EMPLOYEE_NOT_FOUND", 404);
  }
  return employee;
}

function sendError(res: Response, error: unknown): Response {
  if (error instanceof AccountingIntegrityError) {
    return res.status(error.status).json({ message: error.message, code: error.code });
  }
  console.error("Transactional payroll route failed", error);
  return res.status(500).json({ message: error instanceof Error ? error.message : "Payroll posting failed" });
}

export function registerTransactionalPayrollRoutes(app: Express): void {
  app.post("/api/payroll/deposit-employee", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const company = companyId(req);
      const movement = line(req.body.employeeId, req.body.amount);
      const result = await payrollPostingService.post({
        companyId: company,
        kind: "deposit",
        lines: [movement],
        transactionDate: requireDate(req.body.date),
        notes: req.body.notes,
        expenseAccountCode: "SALARY_EXPENSE",
        expenseAccountName: "Salary Expense",
        voucherType: "Journal",
        voucherPrefix: "SAL-DEP",
        sourceType: "PAYROLL_EMPLOYEE_DEPOSIT",
        idempotencyKey: idempotencyKey(req, "EMPLOYEE_DEPOSIT", {
          company,
          movement,
          date: req.body.date,
          notes: req.body.notes ?? null,
        }),
        createdBy: userId(req),
      });
      return res.json({ voucher: result.voucher, employee: await employeeRow(company, movement.employeeId) });
    } catch (error) {
      return sendError(res, error);
    }
  });

  app.post("/api/payroll/bulk-deposit-employees", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const company = companyId(req);
      const movements = lines(req.body.deposits, "No deposits provided");
      const result = await payrollPostingService.post({
        companyId: company,
        kind: "deposit",
        lines: movements,
        transactionDate: requireDate(req.body.date),
        notes: req.body.notes,
        expenseAccountCode: "SALARY_EXPENSE",
        expenseAccountName: "Salary Expense",
        voucherType: "Journal",
        voucherPrefix: "SAL-DEP-BULK",
        sourceType: "PAYROLL_BULK_DEPOSIT",
        idempotencyKey: idempotencyKey(req, "BULK_DEPOSIT", {
          company,
          movements,
          date: req.body.date,
          notes: req.body.notes ?? null,
        }),
        createdBy: userId(req),
      });
      return res.json({ voucher: result.voucher, deposits: result.employees, totalAmount: result.totalAmount });
    } catch (error) {
      return sendError(res, error);
    }
  });

  app.post("/api/payroll/bonus-employee", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const company = companyId(req);
      const movement = line(req.body.employeeId, req.body.amount);
      const result = await payrollPostingService.post({
        companyId: company,
        kind: "bonus",
        lines: [movement],
        transactionDate: requireDate(req.body.date),
        notes: req.body.notes,
        expenseAccountCode: "SALARY_EXPENSE",
        expenseAccountName: "Salary Expense",
        voucherType: "Journal",
        voucherPrefix: "BONUS",
        sourceType: "PAYROLL_EMPLOYEE_BONUS",
        idempotencyKey: idempotencyKey(req, "EMPLOYEE_BONUS", {
          company,
          movement,
          date: req.body.date,
          notes: req.body.notes ?? null,
        }),
        createdBy: userId(req),
      });
      return res.json({ voucher: result.voucher, employee: await employeeRow(company, movement.employeeId) });
    } catch (error) {
      return sendError(res, error);
    }
  });

  app.post("/api/payroll/bulk-bonus-employees", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const company = companyId(req);
      const movements = lines(req.body.bonuses, "No valid bonus amounts provided", true);
      const result = await payrollPostingService.post({
        companyId: company,
        kind: "bonus",
        lines: movements,
        transactionDate: requireDate(req.body.date),
        notes: req.body.notes,
        expenseAccountCode: "BONUS_EXPENSE",
        expenseAccountName: "Bonus Expense",
        voucherType: "Journal",
        voucherPrefix: "BONUS-BULK",
        sourceType: "PAYROLL_BULK_BONUS",
        idempotencyKey: idempotencyKey(req, "BULK_BONUS", {
          company,
          movements,
          date: req.body.date,
          notes: req.body.notes ?? null,
        }),
        createdBy: userId(req),
      });
      return res.json({ voucher: result.voucher, bonuses: result.employees, totalAmount: result.totalAmount });
    } catch (error) {
      return sendError(res, error);
    }
  });

  app.post("/api/payroll/withdraw-employee", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const company = companyId(req);
      const movement = line(req.body.employeeId, req.body.amount);
      const account = paymentAccount(req);
      const result = await payrollPostingService.post({
        companyId: company,
        kind: "withdrawal",
        lines: [movement],
        transactionDate: requireDate(req.body.date),
        notes: req.body.notes,
        paymentAccountType: account.type,
        paymentAccountId: account.id,
        voucherType: "Payment",
        voucherPrefix: "SAL-WD",
        sourceType: "PAYROLL_EMPLOYEE_WITHDRAWAL",
        idempotencyKey: idempotencyKey(req, "EMPLOYEE_WITHDRAWAL", {
          company,
          movement,
          account,
          date: req.body.date,
          notes: req.body.notes ?? null,
        }),
        createdBy: userId(req),
      });
      return res.json({ voucher: result.voucher, employee: await employeeRow(company, movement.employeeId) });
    } catch (error) {
      return sendError(res, error);
    }
  });

  app.post("/api/payroll/bulk-withdraw-employees", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const company = companyId(req);
      const movements = lines(req.body.withdrawals, "No valid withdrawal amounts provided", true);
      const account = paymentAccount(req, true);
      const result = await payrollPostingService.post({
        companyId: company,
        kind: "withdrawal",
        lines: movements,
        transactionDate: requireDate(req.body.date),
        notes: req.body.notes,
        paymentAccountType: account.type,
        paymentAccountId: account.id,
        voucherType: "Journal",
        voucherPrefix: "WD-BULK",
        sourceType: "PAYROLL_BULK_WITHDRAWAL",
        idempotencyKey: idempotencyKey(req, "BULK_WITHDRAWAL", {
          company,
          movements,
          account,
          date: req.body.date,
          notes: req.body.notes ?? null,
        }),
        createdBy: userId(req),
      });
      return res.json({ voucher: result.voucher, withdrawals: result.employees, totalAmount: result.totalAmount });
    } catch (error) {
      return sendError(res, error);
    }
  });

  app.post("/api/payroll/pay-worker", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const company = companyId(req);
      const movement = line(req.body.employeeId, req.body.amount);
      const account = paymentAccount(req);
      const result = await payrollPostingService.post({
        companyId: company,
        kind: "worker_payment",
        lines: [movement],
        transactionDate: requireDate(req.body.date),
        notes: req.body.notes,
        paymentAccountType: account.type,
        paymentAccountId: account.id,
        expenseAccountCode: "SALARY_EXPENSE",
        expenseAccountName: "Salary Expense",
        voucherType: "Payment",
        voucherPrefix: "SAL-PAY",
        sourceType: "PAYROLL_WORKER_PAYMENT",
        idempotencyKey: idempotencyKey(req, "WORKER_PAYMENT", {
          company,
          movement,
          account,
          date: req.body.date,
          notes: req.body.notes ?? null,
        }),
        createdBy: userId(req),
      });
      return res.json({ voucher: result.voucher, employee: await employeeRow(company, movement.employeeId) });
    } catch (error) {
      return sendError(res, error);
    }
  });

  app.post("/api/payroll/bulk-pay-workers", requireAuth, requireNonPOS, async (req, res) => {
    try {
      const company = companyId(req);
      const movements = lines(req.body.payments, "No payments provided");
      const account = paymentAccount(req);
      const result = await payrollPostingService.post({
        companyId: company,
        kind: "worker_payment",
        lines: movements,
        transactionDate: requireDate(req.body.date),
        notes: req.body.notes,
        paymentAccountType: account.type,
        paymentAccountId: account.id,
        expenseAccountCode: "SALARY_EXPENSE",
        expenseAccountName: "Salary Expense",
        voucherType: "Payment",
        voucherPrefix: "SAL-BULK",
        sourceType: "PAYROLL_BULK_WORKER_PAYMENT",
        idempotencyKey: idempotencyKey(req, "BULK_WORKER_PAYMENT", {
          company,
          movements,
          account,
          date: req.body.date,
          notes: req.body.notes ?? null,
        }),
        createdBy: userId(req),
      });
      return res.json({
        voucher: result.voucher,
        paymentsProcessed: result.employees.length,
        totalAmount: result.totalAmount.toFixed(2),
      });
    } catch (error) {
      return sendError(res, error);
    }
  });
}
