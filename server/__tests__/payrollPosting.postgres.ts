import { randomUUID } from "node:crypto";

import { Pool } from "pg";

import { payrollPostingService } from "../services/accounting/payrollPostingService";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function connectionString(): string {
  if (!process.argv.includes("--confirm-disposable")) {
    throw new Error("Refusing to run without --confirm-disposable");
  }
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required");
  const target = new URL(value);
  const databaseName = target.pathname.replace(/^\//, "");
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !/(test|disposable|preview)/i.test(databaseName)
  ) {
    throw new Error("This test only accepts a localhost disposable database");
  }
  return value;
}

async function voucherBalance(
  pool: Pool,
  voucherId: number,
): Promise<{ debit: string; credit: string }> {
  const result = await pool.query(
    `
      SELECT
        COALESCE(SUM(debit_amount), 0)::text AS debit,
        COALESCE(SUM(credit_amount), 0)::text AS credit
      FROM voucher_entries
      WHERE voucher_id = $1
    `,
    [voucherId],
  );
  return result.rows[0];
}

async function employeeState(pool: Pool, employeeId: number) {
  const result = await pool.query(
    `
      SELECT current_balance::text, total_deposits::text, total_withdrawals::text
      FROM employees
      WHERE id = $1
    `,
    [employeeId],
  );
  return result.rows[0];
}

async function main() {
  const pool = new Pool({ connectionString: connectionString() });
  const key = randomUUID().replaceAll("-", "");
  let companyId: number | null = null;

  try {
    const company = await pool.query(
      "INSERT INTO companies (code, name) VALUES ($1, $2) RETURNING id",
      [`P2PAY${key.slice(0, 10)}`, "Program 2 Payroll Disposable Test"],
    );
    companyId = Number(company.rows[0].id);

    const cash = await pool.query(
      `
        INSERT INTO ledger_accounts (
          company_id, code, name, account_type, opening_balance,
          opening_balance_side, active
        ) VALUES ($1, $2, 'Payroll Test Cash', 'Cash', 0, 'Dr', true)
        RETURNING id
      `,
      [companyId, `P2CASH${key.slice(0, 8)}`],
    );
    const cashAccountId = Number(cash.rows[0].id);

    const employee = await pool.query(
      `
        INSERT INTO employees (
          company_id, code, first_name, last_name, join_date,
          employee_type, monthly_salary, current_balance,
          total_deposits, total_withdrawals, active
        ) VALUES ($1, $2, 'Payroll', 'Fixture', '2024-01-01',
          'Employee', 0, 0, 0, 0, true)
        RETURNING id
      `,
      [companyId, `P2EMP${key.slice(0, 8)}`],
    );
    const employeeId = Number(employee.rows[0].id);

    const depositKey = `payroll-deposit-${key}`;
    const deposit = await payrollPostingService.post({
      companyId,
      kind: "deposit",
      lines: [{ employeeId, amount: "100.00" }],
      transactionDate: "2024-06-01",
      notes: "Payroll disposable deposit",
      expenseAccountCode: "SALARY_EXPENSE",
      expenseAccountName: "Salary Expense",
      voucherType: "Journal",
      voucherPrefix: "P2-PAY-DEP",
      sourceType: "PAYROLL_TEST_DEPOSIT",
      idempotencyKey: depositKey,
    });
    assert(!deposit.duplicate, "First payroll deposit was incorrectly marked duplicate");
    const depositBalance = await voucherBalance(pool, deposit.voucher.id);
    assert(depositBalance.debit === depositBalance.credit, "Payroll deposit voucher is unbalanced");

    let state = await employeeState(pool, employeeId);
    assert(state.current_balance === "100.00", "Deposit did not update employee balance exactly");
    assert(state.total_deposits === "100.00", "Deposit did not update total deposits exactly");
    assert(state.total_withdrawals === "0.00", "Deposit changed withdrawals");

    const duplicateDeposit = await payrollPostingService.post({
      companyId,
      kind: "deposit",
      lines: [{ employeeId, amount: "100.00" }],
      transactionDate: "2024-06-01",
      notes: "Payroll disposable deposit",
      expenseAccountCode: "SALARY_EXPENSE",
      expenseAccountName: "Salary Expense",
      voucherType: "Journal",
      voucherPrefix: "P2-PAY-DEP-RETRY",
      sourceType: "PAYROLL_TEST_DEPOSIT",
      idempotencyKey: depositKey,
    });
    assert(duplicateDeposit.duplicate, "Payroll retry did not return the existing posting");
    assert(
      duplicateDeposit.voucher.id === deposit.voucher.id,
      "Payroll retry returned another voucher",
    );
    state = await employeeState(pool, employeeId);
    assert(state.current_balance === "100.00", "Payroll retry changed employee balance twice");
    assert(state.total_deposits === "100.00", "Payroll retry changed total deposits twice");

    const withdrawal = await payrollPostingService.post({
      companyId,
      kind: "withdrawal",
      lines: [{ employeeId, amount: "30.00" }],
      transactionDate: "2024-06-02",
      notes: "Payroll disposable withdrawal",
      paymentAccountType: "cash",
      paymentAccountId: cashAccountId,
      voucherType: "Payment",
      voucherPrefix: "P2-PAY-WD",
      sourceType: "PAYROLL_TEST_WITHDRAWAL",
      idempotencyKey: `payroll-withdrawal-${key}`,
    });
    const withdrawalBalance = await voucherBalance(pool, withdrawal.voucher.id);
    assert(
      withdrawalBalance.debit === withdrawalBalance.credit,
      "Payroll withdrawal voucher is unbalanced",
    );
    state = await employeeState(pool, employeeId);
    assert(state.current_balance === "70.00", "Withdrawal did not reduce employee balance exactly");
    assert(state.total_deposits === "100.00", "Withdrawal changed total deposits");
    assert(state.total_withdrawals === "30.00", "Withdrawal did not update total withdrawals");

    let rejected = false;
    try {
      await payrollPostingService.post({
        companyId,
        kind: "withdrawal",
        lines: [{ employeeId, amount: "1000.00" }],
        transactionDate: "2024-06-03",
        notes: "Payroll disposable rejected withdrawal",
        paymentAccountType: "cash",
        paymentAccountId: cashAccountId,
        voucherType: "Payment",
        voucherPrefix: "P2-PAY-WD-FAIL",
        sourceType: "PAYROLL_TEST_WITHDRAWAL_FAIL",
        idempotencyKey: `payroll-withdrawal-fail-${key}`,
      });
    } catch (error) {
      rejected = error instanceof Error && error.message.includes("insufficient balance");
    }
    assert(rejected, "Insufficient payroll withdrawal was not rejected");
    state = await employeeState(pool, employeeId);
    assert(state.current_balance === "70.00", "Rejected withdrawal changed employee balance");
    assert(state.total_withdrawals === "30.00", "Rejected withdrawal changed withdrawal cache");
    const failedVoucher = await pool.query(
      "SELECT id FROM vouchers WHERE company_id = $1 AND idempotency_key = $2",
      [companyId, `payroll-withdrawal-fail-${key}`],
    );
    assert(failedVoucher.rowCount === 0, "Rejected withdrawal left a partial voucher");

    console.log("payroll postgres integration: passed");
  } finally {
    if (companyId != null) {
      await pool.query(
        "DELETE FROM voucher_entries WHERE voucher_id IN (SELECT id FROM vouchers WHERE company_id = $1)",
        [companyId],
      );
      await pool.query(
        "DELETE FROM vouchers WHERE company_id = $1 AND reversal_of_voucher_id IS NOT NULL",
        [companyId],
      );
      await pool.query("DELETE FROM vouchers WHERE company_id = $1", [companyId]);
      await pool.query("DELETE FROM employees WHERE company_id = $1", [companyId]);
      await pool.query("DELETE FROM ledger_accounts WHERE company_id = $1", [companyId]);
      await pool.query("DELETE FROM companies WHERE id = $1", [companyId]);
    }
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
