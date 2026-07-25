import { randomUUID } from "node:crypto";

import { Pool, type PoolClient, type QueryResult } from "pg";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function rollbackTest(
  client: PoolClient,
  companyId: number,
  debitAccountId: number,
  creditAccountId: number,
  key: string,
) {
  await client.query("BEGIN");
  try {
    const voucher = await client.query(
      `
        INSERT INTO vouchers (
          company_id, voucher_number, voucher_type, voucher_date, total_amount,
          currency, exchange_rate, source_type, source_id, idempotency_key
        ) VALUES ($1, $2, 'Journal', '2024-02-29', 10, 'USD', 1, 'INTEGRATION', $3, $3)
        RETURNING id
      `,
      [companyId, `ROLLBACK-${key}`, `rollback-${key}`],
    );
    await client.query(
      `
        INSERT INTO voucher_entries (
          voucher_id, ledger_account_id, debit_amount, credit_amount,
          currency, base_amount
        ) VALUES
          ($1, $2, 10, 0, 'USD', 10),
          ($1, $3, 0, 10, 'USD', 10)
      `,
      [voucher.rows[0].id, debitAccountId, creditAccountId],
    );
    throw new Error("injected failure");
  } catch (error) {
    await client.query("ROLLBACK");
    if (!(error instanceof Error) || error.message !== "injected failure") throw error;
  }
  const remaining = await client.query(
    "SELECT count(*)::int AS count FROM vouchers WHERE company_id = $1 AND source_id = $2",
    [companyId, `rollback-${key}`],
  );
  assert(remaining.rows[0].count === 0, "Transaction rollback left a partial voucher");
}

async function committedPostingAndReversal(
  client: PoolClient,
  companyId: number,
  debitAccountId: number,
  creditAccountId: number,
  key: string,
) {
  await client.query("BEGIN");
  const original = await client.query(
    `
      INSERT INTO vouchers (
        company_id, voucher_number, voucher_type, voucher_date, total_amount,
        currency, exchange_rate, source_type, source_id, idempotency_key,
        idempotency_fingerprint
      ) VALUES ($1, $2, 'Journal', '2030-12-31', 125, 'EUR', 1.25,
        'INTEGRATION', $3, $3, $4)
      RETURNING id, voucher_date::text AS voucher_date, exchange_rate::text
    `,
    [companyId, `POST-${key}`, `post-${key}`, "a".repeat(64)],
  );
  await client.query(
    `
      INSERT INTO voucher_entries (
        voucher_id, ledger_account_id, debit_amount, credit_amount,
        currency, foreign_amount, exchange_rate, base_amount
      ) VALUES
        ($1, $2, 125, 0, 'EUR', 100, 1.25, 125),
        ($1, $3, 0, 125, 'EUR', 100, 1.25, 125)
    `,
    [original.rows[0].id, debitAccountId, creditAccountId],
  );
  await client.query("COMMIT");
  const storedDate =
    original.rows[0].voucher_date instanceof Date
      ? original.rows[0].voucher_date.toISOString().slice(0, 10)
      : String(original.rows[0].voucher_date).slice(0, 10);
  assert(storedDate === "2030-12-31", "Selected business date was not preserved");

  const duplicate = await client.query(
    `
      INSERT INTO vouchers (
        company_id, voucher_number, voucher_type, voucher_date, total_amount,
        currency, exchange_rate, source_type, source_id, idempotency_key
      ) VALUES ($1, $2, 'Journal', '2030-12-31', 125, 'EUR', 1.25,
        'INTEGRATION_RETRY', $3, $3)
      ON CONFLICT DO NOTHING
      RETURNING id
    `,
    [companyId, `RETRY-${key}`, `post-${key}`],
  );
  assert(duplicate.rowCount === 0, "Duplicate idempotency key committed twice");

  await client.query("BEGIN");
  const reversal = await client.query(
    `
      INSERT INTO vouchers (
        company_id, voucher_number, voucher_type, voucher_date, total_amount,
        currency, exchange_rate, source_type, source_id, idempotency_key,
        reversal_of_voucher_id
      )
      SELECT company_id, $2, voucher_type, '2031-01-01', total_amount,
        currency, exchange_rate, 'VOUCHER_REVERSAL', id::text, $3, id
      FROM vouchers
      WHERE id = $1
      RETURNING id
    `,
    [original.rows[0].id, `REV-${key}`, `reverse-${key}`],
  );
  await client.query(
    `
      INSERT INTO voucher_entries (
        voucher_id, ledger_account_id, bank_account_id, fixed_asset_id,
        customer_id, supplier_id, employee_id, debit_amount, credit_amount,
        currency, foreign_amount, exchange_rate, base_amount, narration
      )
      SELECT $2, ledger_account_id, bank_account_id, fixed_asset_id,
        customer_id, supplier_id, employee_id, credit_amount, debit_amount,
        currency, foreign_amount, exchange_rate, base_amount, narration
      FROM voucher_entries
      WHERE voucher_id = $1
    `,
    [original.rows[0].id, reversal.rows[0].id],
  );
  await client.query("UPDATE vouchers SET reversed_at = now() WHERE id = $1", [
    original.rows[0].id,
  ]);
  await client.query("COMMIT");

  const totals = await client.query(
    `
      SELECT
        sum(ve.debit_amount)::text AS debit,
        sum(ve.credit_amount)::text AS credit,
        count(DISTINCT v.reversal_of_voucher_id) FILTER (
          WHERE v.reversal_of_voucher_id IS NOT NULL
        )::int AS reversal_count,
        min(ve.exchange_rate)::text AS minimum_rate,
        max(ve.exchange_rate)::text AS maximum_rate
      FROM voucher_entries ve
      JOIN vouchers v ON v.id = ve.voucher_id
      WHERE v.company_id = $1
    `,
    [companyId],
  );
  assert(totals.rows[0].debit === totals.rows[0].credit, "Reversal unbalanced the ledger");
  assert(totals.rows[0].reversal_count === 1, "Reversal link was not unique");
  assert(
    totals.rows[0].minimum_rate === totals.rows[0].maximum_rate,
    "Reversal changed historical FX",
  );
}

async function auditFixtureChecks(
  client: PoolClient,
  companyId: number,
  debitAccountId: number,
  creditAccountId: number,
  key: string,
) {
  const employee = await client.query(
    `
      INSERT INTO employees (
        company_id, code, first_name, last_name, join_date, employee_type,
        monthly_salary, opening_balance, current_balance
      ) VALUES ($1, $2, 'Audit', 'Employee', '2024-01-01', 'Employee', 0, 0, 999)
      RETURNING id
    `,
    [companyId, `P2BE${key.slice(0, 10)}`],
  );
  const customer = await client.query(
    `
      INSERT INTO customers (
        company_id, ledger_account_id, code, legal_name, opening_balance,
        opening_balance_side, active
      ) VALUES ($1, $2, $3, 'Audit Customer', 0, 'Dr', true)
      RETURNING id
    `,
    [companyId, debitAccountId, `P2BCU${key.slice(0, 9)}`],
  );
  const supplier = await client.query(
    `
      INSERT INTO suppliers (
        company_id, code, legal_name, email, opening_balance, active
      ) VALUES ($1, $2, 'Audit Supplier', '', 0, true)
      RETURNING id
    `,
    [companyId, `P2BS${key.slice(0, 10)}`],
  );

  const supportingVoucher = await client.query(
    `
      INSERT INTO vouchers (
        company_id, voucher_number, voucher_type, voucher_date, description,
        total_amount, source_type, source_id, idempotency_key
      ) VALUES ($1, $2, 'Journal', '2024-04-01', 'supporting fixture', 20,
        'FIXTURE', $3, $3)
      RETURNING id
    `,
    [companyId, `SUPPORT-${key}`, `support-${key}`],
  );
  await client.query(
    `
      INSERT INTO voucher_entries (
        voucher_id, ledger_account_id, supplier_id, employee_id,
        debit_amount, credit_amount, currency, base_amount
      ) VALUES
        ($1, $2, NULL, NULL, 20, 0, 'USD', 20),
        ($1, NULL, $3, NULL, 0, 10, 'USD', 10),
        ($1, NULL, NULL, $4, 0, 10, 'USD', 10)
    `,
    [supportingVoucher.rows[0].id, debitAccountId, supplier.rows[0].id, employee.rows[0].id],
  );
  await client.query(
    `
      INSERT INTO customer_balances (
        company_id, customer_id, transaction_date, transaction_type,
        debit_amount, credit_amount, balance, currency
      ) VALUES ($1, $2, '2024-04-01', 'ADJUSTMENT', 0, 0, 999, 'USD')
    `,
    [companyId, customer.rows[0].id],
  );

  const unbalanced = await client.query(
    `
      INSERT INTO vouchers (
        company_id, voucher_number, voucher_type, voucher_date, description,
        total_amount, source_type, source_id, idempotency_key
      ) VALUES ($1, $2, 'Journal', '2024-04-02', 'unbalanced fixture', 10,
        'FIXTURE', $3, $3)
      RETURNING id
    `,
    [companyId, `UNBAL-${key}`, `unbalanced-${key}`],
  );
  await client.query(
    `
      INSERT INTO voucher_entries (
        voucher_id, ledger_account_id, debit_amount, credit_amount, currency, base_amount
      ) VALUES
        ($1, $2, 10, 0, 'USD', 10),
        ($1, $3, 0, 9, 'USD', 9)
    `,
    [unbalanced.rows[0].id, debitAccountId, creditAccountId],
  );

  for (let index = 1; index <= 2; index += 1) {
    const duplicate = await client.query(
      `
        INSERT INTO vouchers (
          company_id, voucher_number, voucher_type, voucher_date, description,
          total_amount, source_type, source_id, idempotency_key
        ) VALUES ($1, $2, 'Journal', '2024-04-03', 'duplicate fixture', 5,
          'FIXTURE', $3, $3)
        RETURNING id
      `,
      [companyId, `DUP-${index}-${key}`, `duplicate-${index}-${key}`],
    );
    await client.query(
      `
        INSERT INTO voucher_entries (
          voucher_id, ledger_account_id, debit_amount, credit_amount, currency, base_amount
        ) VALUES
          ($1, $2, 5, 0, 'USD', 5),
          ($1, $3, 0, 5, 'USD', 5)
      `,
      [duplicate.rows[0].id, debitAccountId, creditAccountId],
    );
  }

  const missingFx = await client.query(
    `
      INSERT INTO vouchers (
        company_id, voucher_number, voucher_type, voucher_date, description,
        total_amount, currency, exchange_rate, source_type, source_id, idempotency_key
      ) VALUES ($1, $2, 'Journal', '2024-04-04', 'missing fx fixture', 5,
        'EUR', 1.25, 'FIXTURE', $3, $3)
      RETURNING id
    `,
    [companyId, `FX-${key}`, `fx-${key}`],
  );
  await client.query(
    `
      INSERT INTO voucher_entries (
        voucher_id, ledger_account_id, debit_amount, credit_amount, currency, base_amount
      ) VALUES
        ($1, $2, 5, 0, 'USD', 5),
        ($1, $3, 0, 5, 'USD', 5)
    `,
    [missingFx.rows[0].id, debitAccountId, creditAccountId],
  );

  const { runAudit } = await import("./audit-financial-integrity");
  const results = await runAudit({
    companyId,
    limit: 100,
    output: "json",
    confirmNonProduction: true,
  });
  const count = (name: string) => results.find((result) => result.check === name)?.count ?? 0;
  assert(count("unbalanced_vouchers") >= 1, "Audit missed unbalanced fixture");
  assert(count("customer_balance_mismatch") >= 1, "Audit missed stale customer balance");
  assert(count("supplier_balance_model") >= 1, "Audit missed supplier movement");
  assert(count("employee_balance_mismatch") >= 1, "Audit missed stale employee balance");
  assert(count("duplicate_voucher_signature") >= 1, "Audit missed duplicate signature");
  assert(count("missing_historical_fx") >= 1, "Audit missed incomplete FX metadata");
}

async function cleanAuditCheck(client: PoolClient, key: string) {
  const company = await client.query(
    "INSERT INTO companies (code, name) VALUES ($1, $2) RETURNING id",
    [`P2CLEAN${key.slice(0, 9)}`, "Program 2 Clean Audit Test"],
  );
  const companyId = Number(company.rows[0].id);
  try {
    const { runAudit } = await import("./audit-financial-integrity");
    const results = await runAudit({
      companyId,
      limit: 100,
      output: "json",
      confirmNonProduction: true,
    });
    const unexpected = results.filter((result) => result.count !== 0);
    assert(
      unexpected.length === 0,
      `Clean fixture reported unexplained mismatches: ${unexpected
        .map((result) => `${result.check}=${result.count}`)
        .join(", ")}`,
    );
  } finally {
    await client.query("DELETE FROM companies WHERE id = $1", [companyId]);
  }
}

async function concurrencyChecks(
  pool: Pool,
  companyId: number,
  debitAccountId: number,
  key: string,
) {
  const duplicateKey = `concurrent-${key}`;
  const insertDuplicate = (suffix: string): Promise<QueryResult> =>
    pool.query(
      `
        INSERT INTO vouchers (
          company_id, voucher_number, voucher_type, voucher_date, total_amount,
          source_type, source_id, idempotency_key
        ) VALUES ($1, $2, 'Journal', '2024-05-01', 1, 'CONCURRENCY', $3, $3)
        ON CONFLICT (company_id, idempotency_key) WHERE idempotency_key IS NOT NULL
        DO NOTHING
        RETURNING id
      `,
      [companyId, `CONCURRENT-${suffix}-${key}`, duplicateKey],
    );
  const duplicateResults = await Promise.all([insertDuplicate("A"), insertDuplicate("B")]);
  assert(
    duplicateResults.reduce((count, result) => count + (result.rowCount ?? 0), 0) === 1,
    "Concurrent identical postings created more than one voucher",
  );

  const original = await pool.query(
    `
      INSERT INTO vouchers (
        company_id, voucher_number, voucher_type, voucher_date, total_amount,
        currency, exchange_rate, source_type, source_id, idempotency_key
      ) VALUES ($1, $2, 'Journal', '2024-05-02', 1, 'USD', 1,
        'REVERSAL_CONCURRENCY', $3, $3)
      RETURNING id
    `,
    [companyId, `REV-CONCURRENCY-${key}`, `rev-original-${key}`],
  );
  const originalId = Number(original.rows[0].id);
  const reverseOnce = (suffix: string): Promise<QueryResult> =>
    pool.query(
      `
        INSERT INTO vouchers (
          company_id, voucher_number, voucher_type, voucher_date, total_amount,
          currency, exchange_rate, source_type, source_id, idempotency_key,
          reversal_of_voucher_id
        ) VALUES ($1, $2, 'Journal', '2024-05-03', 1, 'USD', 1,
          'VOUCHER_REVERSAL', $3, $3, $4)
        ON CONFLICT (reversal_of_voucher_id) WHERE reversal_of_voucher_id IS NOT NULL
        DO NOTHING
        RETURNING id
      `,
      [companyId, `REV-CONCURRENT-${suffix}-${key}`, `reverse-${suffix}-${key}`, originalId],
    );
  const reversalResults = await Promise.all([reverseOnce("A"), reverseOnce("B")]);
  assert(
    reversalResults.reduce((count, result) => count + (result.rowCount ?? 0), 0) === 1,
    "Concurrent reversals created more than one reversal voucher",
  );

  const customer = await pool.query(
    `
      INSERT INTO customers (
        company_id, ledger_account_id, code, legal_name, opening_balance,
        opening_balance_side, active
      ) VALUES ($1, $2, $3, 'Concurrency Customer', 0, 'Dr', true)
      RETURNING id
    `,
    [companyId, debitAccountId, `P2CC${key.slice(0, 10)}`],
  );
  const customerId = Number(customer.rows[0].id);
  const appendBalance = async (amount: string, type: string) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1, $2)", [companyId, customerId]);
      await client.query(
        `
          INSERT INTO customer_balances (
            company_id, customer_id, transaction_date, transaction_type,
            debit_amount, credit_amount, balance, currency
          )
          SELECT $1, $2, '2024-05-04', $3, $4, 0,
            coalesce((
              SELECT balance
              FROM customer_balances
              WHERE company_id = $1 AND customer_id = $2
              ORDER BY id DESC
              LIMIT 1
            ), 0) + $4::decimal,
            'USD'
        `,
        [companyId, customerId, type, amount],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };
  await Promise.all([
    appendBalance("10.00", "CONCURRENT_A"),
    appendBalance("20.00", "CONCURRENT_B"),
  ]);
  const finalBalance = await pool.query(
    `
      SELECT balance::text
      FROM customer_balances
      WHERE company_id = $1 AND customer_id = $2
      ORDER BY id DESC
      LIMIT 1
    `,
    [companyId, customerId],
  );
  assert(
    Number(finalBalance.rows[0].balance) === 30,
    "Concurrent customer balance update was lost",
  );
}

async function main() {
  if (!process.argv.includes("--confirm-disposable")) {
    throw new Error("Refusing to run without --confirm-disposable");
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const target = new URL(connectionString);
  const databaseName = target.pathname.replace(/^\//, "");
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !/(test|disposable|preview)/i.test(databaseName)
  ) {
    throw new Error("This integration script only accepts a localhost disposable database");
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  const key = randomUUID().replaceAll("-", "");
  let companyId: number | null = null;
  try {
    await cleanAuditCheck(client, key);
    const company = await client.query(
      "INSERT INTO companies (code, name) VALUES ($1, $2) RETURNING id",
      [`P2B${key.slice(0, 12)}`, "Program 2B Disposable Test"],
    );
    const fixtureCompanyId = Number(company.rows[0].id);
    companyId = fixtureCompanyId;
    const accounts = await client.query(
      `
        INSERT INTO ledger_accounts (
          company_id, code, name, account_type, opening_balance,
          opening_balance_side, active
        ) VALUES
          ($1, $2, 'Program 2B Debit', 'Asset', 0, 'Dr', true),
          ($1, $3, 'Program 2B Credit', 'Liability', 0, 'Cr', true)
        RETURNING id
      `,
      [fixtureCompanyId, `P2BD${key.slice(0, 10)}`, `P2BC${key.slice(0, 10)}`],
    );
    await rollbackTest(client, fixtureCompanyId, accounts.rows[0].id, accounts.rows[1].id, key);
    await committedPostingAndReversal(
      client,
      fixtureCompanyId,
      accounts.rows[0].id,
      accounts.rows[1].id,
      key,
    );
    await concurrencyChecks(pool, fixtureCompanyId, accounts.rows[0].id, key);
    await auditFixtureChecks(
      client,
      fixtureCompanyId,
      accounts.rows[0].id,
      accounts.rows[1].id,
      key,
    );
    console.log("financial postgres integration: passed");
  } finally {
    if (companyId != null) {
      await client.query(
        "DELETE FROM voucher_entries WHERE voucher_id IN (SELECT id FROM vouchers WHERE company_id = $1)",
        [companyId],
      );
      await client.query(
        "DELETE FROM vouchers WHERE company_id = $1 AND reversal_of_voucher_id IS NOT NULL",
        [companyId],
      );
      await client.query("DELETE FROM vouchers WHERE company_id = $1", [companyId]);
      await client.query("DELETE FROM ledger_accounts WHERE company_id = $1", [companyId]);
      await client.query("DELETE FROM customer_balances WHERE company_id = $1", [companyId]);
      await client.query("DELETE FROM customers WHERE company_id = $1", [companyId]);
      await client.query("DELETE FROM employees WHERE company_id = $1", [companyId]);
      await client.query("DELETE FROM suppliers WHERE company_id = $1", [companyId]);
      await client.query("DELETE FROM companies WHERE id = $1", [companyId]);
    }
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
