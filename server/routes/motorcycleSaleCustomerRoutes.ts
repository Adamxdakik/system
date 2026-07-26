import type { Express, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { requireAuth, requireNonPOS } from "../auth";
import { db } from "../db";
import { asyncHandler } from "../lib/asyncHandler";
import { resolveFinalizedInvoiceCustomer } from "../services/motorcycles/finalizedSalePolicy";

function companyIdFrom(req: Request, res: Response): number | null {
  const companyId = req.session.currentCompanyId;
  if (!companyId) {
    res.status(400).json({ message: "No company selected" });
    return null;
  }
  return companyId;
}

export function registerMotorcycleSaleCustomerRoutes(app: Express): void {
  app.get(
    "/api/motorcycle-sales/vouchers/:voucherId/customer",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;

      const voucherId = Number(req.params.voucherId);
      if (!Number.isInteger(voucherId) || voucherId <= 0) {
        return res.status(400).json({ message: "Invalid Sales voucher ID" });
      }

      const voucherResult = await db.execute(sql`
        SELECT id
        FROM vouchers
        WHERE id = ${voucherId}
          AND company_id = ${companyId}
          AND voucher_type = 'Sales'
          AND optional = false
          AND deleted_at IS NULL
          AND reversed_at IS NULL
          AND reversal_of_voucher_id IS NULL
        LIMIT 1
      `);
      if (voucherResult.rows.length === 0) {
        return res.status(404).json({
          message: "Active finalized Sales voucher not found",
        });
      }

      const voucherCustomerResult = await db.execute(sql`
        SELECT
          COALESCE(ve.customer_id, ledger_customer.id) AS "customerId",
          COALESCE(direct_customer.legal_name, ledger_customer.legal_name) AS "customerName"
        FROM voucher_entries ve
        LEFT JOIN customers direct_customer
          ON direct_customer.id = ve.customer_id
          AND direct_customer.company_id = ${companyId}
          AND direct_customer.deleted_at IS NULL
        LEFT JOIN customers ledger_customer
          ON ledger_customer.ledger_account_id = ve.ledger_account_id
          AND ledger_customer.company_id = ${companyId}
          AND ledger_customer.deleted_at IS NULL
        WHERE ve.voucher_id = ${voucherId}
          AND ve.debit_amount > 0
          AND (ve.customer_id IS NOT NULL OR ledger_customer.id IS NOT NULL)
        ORDER BY ve.id
        LIMIT 1
      `);

      const linkedCustomerResult = await db.execute(sql`
        SELECT
          linked.customer_id AS "customerId",
          customer.legal_name AS "customerName"
        FROM bike_purchases linked
        INNER JOIN customers customer
          ON customer.id = linked.customer_id
          AND customer.company_id = linked.company_id
          AND customer.deleted_at IS NULL
        WHERE linked.company_id = ${companyId}
          AND linked.sale_voucher_id = ${voucherId}
          AND linked.customer_id IS NOT NULL
          AND linked.deleted_at IS NULL
        ORDER BY linked.id
        LIMIT 1
      `);

      const voucherCustomer = voucherCustomerResult.rows[0] as
        | { customerId: number | string | null; customerName: string | null }
        | undefined;
      const linkedCustomer = linkedCustomerResult.rows[0] as
        | { customerId: number | string | null; customerName: string | null }
        | undefined;

      const voucherCustomerId = Number(voucherCustomer?.customerId) || null;
      const linkedCustomerId = Number(linkedCustomer?.customerId) || null;
      const customerId = resolveFinalizedInvoiceCustomer(voucherCustomerId, linkedCustomerId);
      const source = voucherCustomerId ? "voucher" : linkedCustomerId ? "linked_motorcycle" : null;
      const customerName = voucherCustomerId
        ? (voucherCustomer?.customerName ?? null)
        : linkedCustomerId
          ? (linkedCustomer?.customerName ?? null)
          : null;

      return res.json({ customerId, customerName, source });
    }),
  );
}
