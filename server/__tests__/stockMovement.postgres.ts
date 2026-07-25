import { randomUUID } from "node:crypto";

import { Pool } from "pg";

import { stockMovementService } from "../services/accounting/stockMovementService";
import { AccountingIntegrityError } from "../services/accounting/voucherPostingService";

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

async function inventoryState(
  pool: Pool,
  companyId: number,
  locationId: number,
  stockItemId: number,
) {
  const result = await pool.query(
    `
      SELECT quantity::text, total_value::text, average_rate::text
      FROM inventory
      WHERE company_id = $1 AND location_id = $2 AND stock_item_id = $3
    `,
    [companyId, locationId, stockItemId],
  );
  assert(result.rowCount === 1, `Expected one inventory row for ${locationId}/${stockItemId}`);
  return result.rows[0] as {
    quantity: string;
    total_value: string;
    average_rate: string;
  };
}

async function main() {
  const pool = new Pool({ connectionString: connectionString() });
  const key = randomUUID().replaceAll("-", "");
  let companyId: number | null = null;

  try {
    const company = await pool.query(
      "INSERT INTO companies (code, name) VALUES ($1, $2) RETURNING id",
      [`P2STK${key.slice(0, 9)}`, "Program 2 Stock Movement Test"],
    );
    companyId = Number(company.rows[0].id);

    const locationRows = await pool.query(
      `
        INSERT INTO locations (company_id, code, name, active)
        VALUES
          ($1, $2, 'Stock Source', true),
          ($1, $3, 'Stock Destination', true)
        RETURNING id
      `,
      [companyId, `P2SRC${key.slice(0, 8)}`, `P2DST${key.slice(0, 8)}`],
    );
    const sourceLocationId = Number(locationRows.rows[0].id);
    const destinationLocationId = Number(locationRows.rows[1].id);

    const itemRow = await pool.query(
      `
        INSERT INTO stock_items (company_id, code, name, uom, active)
        VALUES ($1, $2, 'Stock Evidence Item', 'EA', true)
        RETURNING id
      `,
      [companyId, `P2ITEM${key.slice(0, 8)}`],
    );
    const stockItemId = Number(itemRow.rows[0].id);

    await pool.query(
      `
        INSERT INTO inventory (
          company_id, location_id, stock_item_id, quantity, average_rate, total_value
        ) VALUES
          ($1, $2, $4, 10.000, 12.35, 123.45),
          ($1, $3, $4, 5.000, 10.00, 50.00)
      `,
      [companyId, sourceLocationId, destinationLocationId, stockItemId],
    );

    const transferInput = {
      companyId,
      voucher: {
        voucherDate: "2024-07-01",
        description: "Exact value transfer",
        optional: false,
        currency: "USD",
        exchangeRate: "1",
      },
      destinationLocationId,
      notes: "Exact value transfer",
      items: [
        {
          sourceLocationId,
          stockItemId,
          quantity: "3.000",
          rate: "99.00",
        },
      ],
      idempotencyKey: `stock-transfer-${key}`,
    };

    const transfer = await stockMovementService.createTransfer(transferInput);
    assert(!transfer.duplicate, "First stock transfer was incorrectly marked duplicate");
    assert(
      transfer.voucher.totalAmount === "37.04",
      "Transfer did not store proportional source value",
    );
    assert(transfer.items[0].totalAmount === "37.04", "Transfer item did not store exact value");

    let source = await inventoryState(pool, companyId, sourceLocationId, stockItemId);
    let destination = await inventoryState(
      pool,
      companyId,
      destinationLocationId,
      stockItemId,
    );
    assert(source.quantity === "7.000", "Transfer source quantity is wrong");
    assert(source.total_value === "86.41", "Transfer source value is wrong");
    assert(destination.quantity === "8.000", "Transfer destination quantity is wrong");
    assert(destination.total_value === "87.04", "Transfer destination value is wrong");

    const evidence = await pool.query(
      `
        SELECT actual_total_cost::text, evidence_status
        FROM stock_movement_cost_evidence
        WHERE original_voucher_id = $1
      `,
      [transfer.voucher.id],
    );
    assert(evidence.rowCount === 1, "Transfer cost evidence was not persisted");
    assert(evidence.rows[0].actual_total_cost === "37.04", "Transfer evidence value is wrong");
    assert(evidence.rows[0].evidence_status === "EXACT", "Transfer evidence is not exact");

    const duplicateTransfer = await stockMovementService.createTransfer(transferInput);
    assert(duplicateTransfer.duplicate, "Transfer retry was not idempotent");
    assert(
      duplicateTransfer.voucher.id === transfer.voucher.id,
      "Transfer retry created another voucher",
    );

    const transferReversal = await stockMovementService.reverse({
      companyId,
      voucherId: transfer.voucher.id,
      transactionDate: "2024-07-02",
      reason: "Test transfer reversal",
      idempotencyKey: `stock-transfer-reversal-${key}`,
    });
    assert(!transferReversal.duplicate, "First transfer reversal was marked duplicate");
    source = await inventoryState(pool, companyId, sourceLocationId, stockItemId);
    destination = await inventoryState(pool, companyId, destinationLocationId, stockItemId);
    assert(
      source.quantity === "10.000" && source.total_value === "123.45",
      "Transfer reversal did not restore source exactly",
    );
    assert(
      destination.quantity === "5.000" && destination.total_value === "50.00",
      "Transfer reversal did not restore destination exactly",
    );

    const duplicateReversal = await stockMovementService.reverse({
      companyId,
      voucherId: transfer.voucher.id,
      transactionDate: "2024-07-02",
      reason: "Test transfer reversal",
      idempotencyKey: `stock-transfer-reversal-${key}`,
    });
    assert(duplicateReversal.duplicate, "Transfer reversal retry was not idempotent");

    const optionalTransfer = await stockMovementService.createTransfer({
      ...transferInput,
      voucher: {
        ...transferInput.voucher,
        voucherDate: "2024-07-03",
        optional: true,
        description: "Optional transfer",
      },
      items: [{ sourceLocationId, stockItemId, quantity: "1.000", rate: "12.35" }],
      idempotencyKey: `optional-stock-transfer-${key}`,
    });
    assert(optionalTransfer.voucher.optional, "Optional transfer was not saved as a draft");
    source = await inventoryState(pool, companyId, sourceLocationId, stockItemId);
    assert(
      source.quantity === "10.000" && source.total_value === "123.45",
      "Optional transfer changed inventory before activation",
    );

    const activatedTransfer = await stockMovementService.activate(
      companyId,
      optionalTransfer.voucher.id,
    );
    assert(!activatedTransfer.voucher.optional, "Optional transfer was not activated");
    source = await inventoryState(pool, companyId, sourceLocationId, stockItemId);
    destination = await inventoryState(pool, companyId, destinationLocationId, stockItemId);
    assert(
      source.quantity === "9.000" && source.total_value === "111.10",
      "Activated transfer source is wrong",
    );
    assert(
      destination.quantity === "6.000" && destination.total_value === "62.35",
      "Activated transfer destination is wrong",
    );

    await stockMovementService.reverse({
      companyId,
      voucherId: optionalTransfer.voucher.id,
      transactionDate: "2024-07-04",
      reason: "Reverse activated transfer",
      idempotencyKey: `optional-stock-transfer-reversal-${key}`,
    });

    const consumption = await stockMovementService.createAdjustment({
      companyId,
      voucher: {
        voucherDate: "2024-07-05",
        description: "Exact consumption",
        optional: false,
      },
      locationId: sourceLocationId,
      adjustmentType: "Consumption",
      notes: "Exact consumption",
      items: [{ stockItemId, quantity: "-2.000", rate: "999.00" }],
      idempotencyKey: `stock-consumption-${key}`,
    });
    assert(
      consumption.voucher.totalAmount === "24.69",
      "Consumption did not use exact current inventory value",
    );
    source = await inventoryState(pool, companyId, sourceLocationId, stockItemId);
    assert(
      source.quantity === "8.000" && source.total_value === "98.76",
      "Consumption inventory result is wrong",
    );

    await stockMovementService.reverse({
      companyId,
      voucherId: consumption.voucher.id,
      transactionDate: "2024-07-06",
      reason: "Reverse consumption",
      idempotencyKey: `stock-consumption-reversal-${key}`,
    });
    source = await inventoryState(pool, companyId, sourceLocationId, stockItemId);
    assert(
      source.quantity === "10.000" && source.total_value === "123.45",
      "Consumption reversal was not exact",
    );

    const production = await stockMovementService.createAdjustment({
      companyId,
      voucher: {
        voucherDate: "2024-07-07",
        description: "Declared production",
        optional: false,
      },
      locationId: sourceLocationId,
      adjustmentType: "Production",
      notes: "Declared production",
      items: [{ stockItemId, quantity: "2.000", rate: "4.25" }],
      idempotencyKey: `stock-production-${key}`,
    });
    assert(production.voucher.totalAmount === "8.50", "Production declared value is wrong");
    source = await inventoryState(pool, companyId, sourceLocationId, stockItemId);
    assert(
      source.quantity === "12.000" && source.total_value === "131.95",
      "Production inventory result is wrong",
    );

    await stockMovementService.reverse({
      companyId,
      voucherId: production.voucher.id,
      transactionDate: "2024-07-08",
      reason: "Reverse production",
      idempotencyKey: `stock-production-reversal-${key}`,
    });
    source = await inventoryState(pool, companyId, sourceLocationId, stockItemId);
    assert(
      source.quantity === "10.000" && source.total_value === "123.45",
      "Production reversal was not exact",
    );

    let insufficientRejected = false;
    try {
      await stockMovementService.createTransfer({
        ...transferInput,
        voucher: { ...transferInput.voucher, voucherDate: "2024-07-09" },
        items: [{ sourceLocationId, stockItemId, quantity: "999.000", rate: "1.00" }],
        idempotencyKey: `stock-insufficient-${key}`,
      });
    } catch (error) {
      insufficientRejected =
        error instanceof AccountingIntegrityError && error.code === "INSUFFICIENT_STOCK";
    }
    assert(insufficientRejected, "Insufficient stock transfer was not rejected");
    const partialVoucher = await pool.query(
      "SELECT id FROM vouchers WHERE company_id = $1 AND idempotency_key = $2",
      [companyId, `stock-insufficient-${key}`],
    );
    assert(partialVoucher.rowCount === 0, "Rejected transfer left an orphan voucher");

    const legacyVoucher = await pool.query(
      `
        INSERT INTO vouchers (
          company_id, voucher_number, voucher_type, voucher_date, total_amount,
          currency, exchange_rate, optional
        ) VALUES ($1, $2, 'StockTransfer', '2024-07-10', 1.00, 'USD', 1, false)
        RETURNING id
      `,
      [companyId, `LEGACY-STOCK-${key.slice(0, 8)}`],
    );
    const legacyVoucherId = Number(legacyVoucher.rows[0].id);
    const legacyTransfer = await pool.query(
      `
        INSERT INTO stock_transfer_vouchers (
          voucher_id, source_location_id, destination_location_id, notes
        ) VALUES ($1, $2, $3, 'Legacy transfer')
        RETURNING id
      `,
      [legacyVoucherId, sourceLocationId, destinationLocationId],
    );
    await pool.query(
      `
        INSERT INTO stock_transfer_items (
          transfer_id, stock_item_id, source_location_id, quantity, rate, total_amount
        ) VALUES ($1, $2, $3, 1.000, 1.00, 1.00)
      `,
      [legacyTransfer.rows[0].id, stockItemId, sourceLocationId],
    );

    let legacyRejected = false;
    try {
      await stockMovementService.reverse({
        companyId,
        voucherId: legacyVoucherId,
        transactionDate: "2024-07-11",
        reason: "Unsafe legacy reversal",
        idempotencyKey: `legacy-stock-reversal-${key}`,
      });
    } catch (error) {
      legacyRejected =
        error instanceof AccountingIntegrityError &&
        error.code === "LEGACY_STOCK_COST_UNRESOLVED";
    }
    assert(legacyRejected, "Legacy movement without exact cost evidence was not refused");

    console.log("stock movement postgres integration: passed");
  } finally {
    if (companyId != null) {
      await pool.query(`DELETE FROM stock_movement_cost_evidence WHERE company_id = $1`, [
        companyId,
      ]);
      await pool.query(
        `
          DELETE FROM stock_transfer_items
          WHERE transfer_id IN (
            SELECT stv.id FROM stock_transfer_vouchers stv
            JOIN vouchers v ON v.id = stv.voucher_id
            WHERE v.company_id = $1
          )
        `,
        [companyId],
      );
      await pool.query(
        `
          DELETE FROM stock_adjustment_items
          WHERE adjustment_id IN (
            SELECT sav.id FROM stock_adjustment_vouchers sav
            JOIN vouchers v ON v.id = sav.voucher_id
            WHERE v.company_id = $1
          )
        `,
        [companyId],
      );
      await pool.query(
        `DELETE FROM stock_transfer_vouchers WHERE voucher_id IN (SELECT id FROM vouchers WHERE company_id = $1)`,
        [companyId],
      );
      await pool.query(
        `DELETE FROM stock_adjustment_vouchers WHERE voucher_id IN (SELECT id FROM vouchers WHERE company_id = $1)`,
        [companyId],
      );
      await pool.query(
        `DELETE FROM vouchers WHERE company_id = $1 AND reversal_of_voucher_id IS NOT NULL`,
        [companyId],
      );
      await pool.query(`DELETE FROM vouchers WHERE company_id = $1`, [companyId]);
      await pool.query(`DELETE FROM inventory WHERE company_id = $1`, [companyId]);
      await pool.query(`DELETE FROM stock_items WHERE company_id = $1`, [companyId]);
      await pool.query(`DELETE FROM locations WHERE company_id = $1`, [companyId]);
      await pool.query(`DELETE FROM companies WHERE id = $1`, [companyId]);
    }
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
