import type { Express, NextFunction, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireNonPOS, requireRole } from "../auth";
import { db } from "../db";
import { asyncHandler } from "../lib/asyncHandler";

const saleLinkSchema = z
  .object({
    voucherId: z.number().int().positive("Sales voucher is required"),
    customerId: z.number().int().positive().nullable().optional(),
    sellingPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Selling price must have up to 2 decimals"),
    warrantyStartDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Warranty start date must use YYYY-MM-DD")
      .nullable()
      .optional(),
    warrantyEndDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Warranty end date must use YYYY-MM-DD")
      .nullable()
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (Number(value.sellingPrice) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sellingPrice"],
        message: "Selling price must be greater than zero",
      });
    }
    if (
      value.warrantyStartDate &&
      value.warrantyEndDate &&
      value.warrantyEndDate < value.warrantyStartDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["warrantyEndDate"],
        message: "Warranty end date cannot be before the start date",
      });
    }
  });

function companyIdFrom(req: Request, res: Response): number | null {
  const companyId = req.session.currentCompanyId;
  if (!companyId) {
    res.status(400).json({ message: "No company selected" });
    return null;
  }
  return companyId;
}

function sameMoney(left: unknown, right: unknown): boolean {
  if (left == null && right == null) return true;
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  return Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber === rightNumber;
}

async function getMotorcycleSaleRecord(companyId: number, id: number) {
  const result = await db.execute(sql`
    SELECT
      bp.id,
      bp.company_id AS "companyId",
      bp.customer_id AS "customerId",
      bp.brand,
      bp.bike_model AS "bikeModel",
      bp.color,
      bp.engine_number AS "engineNumber",
      bp.chassis_number AS "chassisNumber",
      bp.model_year AS "modelYear",
      bp.purchase_cost AS "purchaseCost",
      bp.selling_price AS "sellingPrice",
      bp.location_id AS "locationId",
      bp.status,
      bp.supplier_id AS "supplierId",
      bp.container_id AS "containerId",
      bp.sale_date AS "saleDate",
      bp.invoice_number AS "invoiceNumber",
      bp.warranty_start_date AS "warrantyStartDate",
      bp.warranty_end_date AS "warrantyEndDate",
      bp.sale_voucher_id AS "saleVoucherId",
      bp.sale_linked_at AS "saleLinkedAt",
      bp.sold_by_user_id AS "soldByUserId",
      bp.notes,
      bp.created_at AS "createdAt",
      bp.updated_at AS "updatedAt",
      c.legal_name AS "customerName",
      l.name AS "locationName",
      s.legal_name AS "supplierName",
      co.container_number AS "containerNumber",
      v.voucher_number AS "saleVoucherNumber",
      v.total_amount AS "saleVoucherTotal",
      v.reversed_at AS "saleVoucherReversedAt"
    FROM bike_purchases bp
    LEFT JOIN customers c
      ON c.id = bp.customer_id
      AND c.company_id = bp.company_id
      AND c.deleted_at IS NULL
    LEFT JOIN locations l
      ON l.id = bp.location_id
      AND l.company_id = bp.company_id
      AND l.deleted_at IS NULL
    LEFT JOIN suppliers s
      ON s.id = bp.supplier_id
      AND s.company_id = bp.company_id
      AND s.deleted_at IS NULL
    LEFT JOIN containers co
      ON co.id = bp.container_id
      AND co.company_id = bp.company_id
    LEFT JOIN vouchers v
      ON v.id = bp.sale_voucher_id
      AND v.company_id = bp.company_id
    WHERE bp.id = ${id}
      AND bp.company_id = ${companyId}
      AND bp.deleted_at IS NULL
    LIMIT 1
  `);

  return result.rows[0] ?? null;
}

export function registerMotorcycleSaleRoutes(app: Express): void {
  // Guard the generic registry endpoints so a sale cannot be invented or erased manually.
  app.post(
    "/api/motorcycles",
    requireAuth,
    requireNonPOS,
    (req: Request, res: Response, next: NextFunction) => {
      if (req.body?.status === "SOLD") {
        return res.status(409).json({
          message: "Use Link finalized sale to mark a motorcycle as sold",
          code: "FINALIZED_SALE_REQUIRED",
        });
      }
      return next();
    },
  );

  app.put(
    "/api/motorcycles/:id",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res, next) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;

      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid motorcycle ID" });
      }

      const result = await db.execute(sql`
        SELECT
          status,
          customer_id AS "customerId",
          sale_date AS "saleDate",
          invoice_number AS "invoiceNumber",
          selling_price AS "sellingPrice",
          sale_voucher_id AS "saleVoucherId"
        FROM bike_purchases
        WHERE id = ${id}
          AND company_id = ${companyId}
          AND deleted_at IS NULL
        LIMIT 1
      `);
      const existing = result.rows[0] as
        | {
            status: string;
            customerId: number | null;
            saleDate: string | null;
            invoiceNumber: string | null;
            sellingPrice: string | null;
            saleVoucherId: number | null;
          }
        | undefined;

      if (!existing) {
        return res.status(404).json({ message: "Motorcycle not found" });
      }

      if (!existing.saleVoucherId && req.body?.status === "SOLD") {
        return res.status(409).json({
          message: "Use Link finalized sale to mark a motorcycle as sold",
          code: "FINALIZED_SALE_REQUIRED",
        });
      }

      if (existing.saleVoucherId) {
        const saleFieldsChanged =
          req.body?.status !== "SOLD" ||
          Number(req.body?.customerId ?? 0) !== Number(existing.customerId ?? 0) ||
          (req.body?.saleDate ?? null) !== existing.saleDate ||
          (req.body?.invoiceNumber ?? null) !== existing.invoiceNumber ||
          !sameMoney(req.body?.sellingPrice, existing.sellingPrice);

        if (saleFieldsChanged) {
          return res.status(409).json({
            message:
              "Finalized motorcycle sale details are locked. Reverse the linked Sales voucher before releasing or changing ownership.",
            code: "FINALIZED_MOTORCYCLE_SALE_LOCKED",
          });
        }
      }

      return next();
    }),
  );

  app.delete(
    "/api/motorcycles/:id",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res, next) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;

      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid motorcycle ID" });
      }

      const result = await db.execute(sql`
        SELECT sale_voucher_id AS "saleVoucherId"
        FROM bike_purchases
        WHERE id = ${id}
          AND company_id = ${companyId}
          AND deleted_at IS NULL
        LIMIT 1
      `);
      const existing = result.rows[0] as { saleVoucherId: number | null } | undefined;
      if (!existing) {
        return res.status(404).json({ message: "Motorcycle not found" });
      }
      if (existing.saleVoucherId) {
        return res.status(409).json({
          message: "A motorcycle linked to a finalized sale cannot be deleted",
          code: "FINALIZED_MOTORCYCLE_SALE_LOCKED",
        });
      }
      return next();
    }),
  );

  app.get(
    "/api/motorcycle-sales/vouchers",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;

      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const locationId =
        typeof req.query.locationId === "string" && req.query.locationId
          ? Number(req.query.locationId)
          : null;
      const requestedLimit = Number(req.query.limit ?? 50);
      const limit = Number.isInteger(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 100)
        : 50;

      if (locationId !== null && (!Number.isInteger(locationId) || locationId <= 0)) {
        return res.status(400).json({ message: "Invalid location" });
      }

      const conditions = [
        sql`v.company_id = ${companyId}`,
        sql`v.voucher_type = 'Sales'`,
        sql`v.optional = false`,
        sql`v.deleted_at IS NULL`,
        sql`v.reversed_at IS NULL`,
        sql`v.reversal_of_voucher_id IS NULL`,
        sql`COALESCE(linked_sales."linkedMotorcycleTotal", 0) < v.total_amount`,
      ];
      if (locationId) conditions.push(sql`v.location_id = ${locationId}`);
      if (q) {
        const pattern = `%${q}%`;
        conditions.push(sql`(
          v.voucher_number ILIKE ${pattern}
          OR v.description ILIKE ${pattern}
          OR buyer."customerName" ILIKE ${pattern}
        )`);
      }

      const result = await db.execute(sql`
        SELECT
          v.id,
          v.voucher_number AS "voucherNumber",
          v.voucher_date AS "voucherDate",
          v.total_amount AS "totalAmount",
          v.currency,
          v.location_id AS "locationId",
          v.location_name AS "locationName",
          v.description,
          buyer."customerId",
          buyer."customerName",
          COALESCE(linked_sales."linkedMotorcycleCount", 0)::integer AS "linkedMotorcycleCount",
          COALESCE(linked_sales."linkedMotorcycleTotal", 0) AS "linkedMotorcycleTotal",
          v.total_amount - COALESCE(linked_sales."linkedMotorcycleTotal", 0) AS "remainingAmount"
        FROM vouchers v
        LEFT JOIN LATERAL (
          SELECT
            COALESCE(ve.customer_id, ledger_customer.id) AS "customerId",
            COALESCE(direct_customer.legal_name, ledger_customer.legal_name) AS "customerName"
          FROM voucher_entries ve
          LEFT JOIN customers direct_customer
            ON direct_customer.id = ve.customer_id
            AND direct_customer.company_id = v.company_id
            AND direct_customer.deleted_at IS NULL
          LEFT JOIN customers ledger_customer
            ON ledger_customer.ledger_account_id = ve.ledger_account_id
            AND ledger_customer.company_id = v.company_id
            AND ledger_customer.deleted_at IS NULL
          WHERE ve.voucher_id = v.id
            AND ve.debit_amount > 0
          ORDER BY ve.id
          LIMIT 1
        ) buyer ON true
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*) AS "linkedMotorcycleCount",
            COALESCE(SUM(linked.selling_price), 0) AS "linkedMotorcycleTotal"
          FROM bike_purchases linked
          WHERE linked.company_id = v.company_id
            AND linked.sale_voucher_id = v.id
            AND linked.deleted_at IS NULL
        ) linked_sales ON true
        WHERE ${sql.join(conditions, sql` AND `)}
        ORDER BY v.voucher_date DESC, v.id DESC
        LIMIT ${limit}
      `);

      return res.json(result.rows);
    }),
  );

  app.post(
    "/api/motorcycles/:id/link-sale",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;

      const motorcycleId = Number(req.params.id);
      if (!Number.isInteger(motorcycleId) || motorcycleId <= 0) {
        return res.status(400).json({ message: "Invalid motorcycle ID" });
      }

      const parsed = saleLinkSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues[0]?.message ?? "Invalid finalized sale link",
        });
      }

      const input = parsed.data;

      try {
        await db.transaction(async (tx) => {
          const motorcycleResult = await tx.execute(sql`
            SELECT
              id,
              status,
              location_id AS "locationId",
              sale_voucher_id AS "saleVoucherId"
            FROM bike_purchases
            WHERE id = ${motorcycleId}
              AND company_id = ${companyId}
              AND deleted_at IS NULL
            FOR UPDATE
          `);
          const motorcycle = motorcycleResult.rows[0] as
            | {
                id: number;
                status: string;
                locationId: number | null;
                saleVoucherId: number | null;
              }
            | undefined;

          if (!motorcycle) {
            throw Object.assign(new Error("Motorcycle not found"), { httpStatus: 404 });
          }
          if (motorcycle.saleVoucherId === input.voucherId && motorcycle.status === "SOLD") {
            return;
          }
          if (motorcycle.saleVoucherId || motorcycle.status === "SOLD") {
            throw Object.assign(new Error("This motorcycle is already linked to a sale"), {
              httpStatus: 409,
            });
          }
          if (!["IN_STOCK", "RESERVED"].includes(motorcycle.status)) {
            throw Object.assign(
              new Error("Only in-stock or reserved motorcycles can be linked to a sale"),
              { httpStatus: 409 },
            );
          }

          const voucherResult = await tx.execute(sql`
            SELECT
              id,
              voucher_number AS "voucherNumber",
              voucher_date AS "voucherDate",
              total_amount AS "totalAmount",
              location_id AS "locationId"
            FROM vouchers
            WHERE id = ${input.voucherId}
              AND company_id = ${companyId}
              AND voucher_type = 'Sales'
              AND optional = false
              AND deleted_at IS NULL
              AND reversed_at IS NULL
              AND reversal_of_voucher_id IS NULL
            FOR UPDATE
          `);
          const voucher = voucherResult.rows[0] as
            | {
                id: number;
                voucherNumber: string;
                voucherDate: string;
                totalAmount: string;
                locationId: number | null;
              }
            | undefined;

          if (!voucher) {
            throw Object.assign(
              new Error("The selected voucher is not an active finalized Sales voucher"),
              { httpStatus: 409 },
            );
          }
          if (
            motorcycle.locationId &&
            voucher.locationId &&
            motorcycle.locationId !== voucher.locationId
          ) {
            throw Object.assign(
              new Error("The Sales voucher location does not match the motorcycle location"),
              { httpStatus: 409 },
            );
          }
          const linkedTotalResult = await tx.execute(sql`
            SELECT COALESCE(SUM(selling_price), 0) AS "linkedTotal"
            FROM bike_purchases
            WHERE company_id = ${companyId}
              AND sale_voucher_id = ${voucher.id}
              AND id <> ${motorcycleId}
              AND deleted_at IS NULL
          `);
          const linkedTotal = Number(linkedTotalResult.rows[0]?.linkedTotal ?? 0);
          if (linkedTotal + Number(input.sellingPrice) > Number(voucher.totalAmount)) {
            throw Object.assign(
              new Error("The combined motorcycle prices cannot exceed the finalized voucher total"),
              { httpStatus: 400 },
            );
          }

          let customerId = input.customerId ?? null;
          if (!customerId) {
            const inferredCustomerResult = await tx.execute(sql`
              SELECT COALESCE(ve.customer_id, c.id) AS "customerId"
              FROM voucher_entries ve
              LEFT JOIN customers c
                ON c.ledger_account_id = ve.ledger_account_id
                AND c.company_id = ${companyId}
                AND c.deleted_at IS NULL
              WHERE ve.voucher_id = ${voucher.id}
                AND ve.debit_amount > 0
                AND (ve.customer_id IS NOT NULL OR c.id IS NOT NULL)
              ORDER BY ve.id
              LIMIT 1
            `);
            customerId = Number(inferredCustomerResult.rows[0]?.customerId) || null;
          }

          if (!customerId) {
            throw Object.assign(new Error("Select the customer who bought this motorcycle"), {
              httpStatus: 400,
            });
          }

          const customerResult = await tx.execute(sql`
            SELECT id
            FROM customers
            WHERE id = ${customerId}
              AND company_id = ${companyId}
              AND deleted_at IS NULL
            LIMIT 1
          `);
          if (customerResult.rows.length === 0) {
            throw Object.assign(new Error("Customer does not belong to the selected company"), {
              httpStatus: 400,
            });
          }

          await tx.execute(sql`
            UPDATE bike_purchases
            SET
              status = 'SOLD',
              customer_id = ${customerId},
              sale_date = ${voucher.voucherDate},
              invoice_number = ${voucher.voucherNumber},
              selling_price = ${input.sellingPrice},
              warranty_start_date = ${input.warrantyStartDate ?? voucher.voucherDate},
              warranty_end_date = ${input.warrantyEndDate ?? null},
              sale_voucher_id = ${voucher.id},
              sale_linked_at = now(),
              sold_by_user_id = ${req.session.userId ?? null},
              updated_at = now()
            WHERE id = ${motorcycleId}
              AND company_id = ${companyId}
              AND deleted_at IS NULL
          `);
        });
      } catch (error: any) {
        if (error?.httpStatus) {
          return res.status(error.httpStatus).json({ message: error.message });
        }
        throw error;
      }

      const motorcycle = await getMotorcycleSaleRecord(companyId, motorcycleId);
      return res.json(motorcycle);
    }),
  );

  app.post(
    "/api/motorcycles/:id/release-sale",
    requireAuth,
    requireRole("Admin"),
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;

      const motorcycleId = Number(req.params.id);
      if (!Number.isInteger(motorcycleId) || motorcycleId <= 0) {
        return res.status(400).json({ message: "Invalid motorcycle ID" });
      }

      await db
        .transaction(async (tx) => {
          const result = await tx.execute(sql`
          SELECT
            bp.sale_voucher_id AS "saleVoucherId",
            v.reversed_at AS "reversedAt"
          FROM bike_purchases bp
          LEFT JOIN vouchers v
            ON v.id = bp.sale_voucher_id
            AND v.company_id = bp.company_id
          WHERE bp.id = ${motorcycleId}
            AND bp.company_id = ${companyId}
            AND bp.deleted_at IS NULL
          FOR UPDATE OF bp
        `);
          const linked = result.rows[0] as
            | { saleVoucherId: number | null; reversedAt: Date | null }
            | undefined;

          if (!linked) {
            throw Object.assign(new Error("Motorcycle not found"), { httpStatus: 404 });
          }
          if (!linked.saleVoucherId) {
            throw Object.assign(new Error("Motorcycle is not linked to a finalized sale"), {
              httpStatus: 409,
            });
          }
          if (!linked.reversedAt) {
            throw Object.assign(
              new Error("Reverse the linked Sales voucher before releasing this motorcycle"),
              { httpStatus: 409 },
            );
          }

          await tx.execute(sql`
          UPDATE bike_purchases
          SET
            status = 'IN_STOCK',
            customer_id = NULL,
            sale_date = NULL,
            invoice_number = NULL,
            warranty_start_date = NULL,
            warranty_end_date = NULL,
            sale_voucher_id = NULL,
            sale_linked_at = NULL,
            sold_by_user_id = NULL,
            updated_at = now()
          WHERE id = ${motorcycleId}
            AND company_id = ${companyId}
            AND deleted_at IS NULL
        `);
        })
        .catch((error: any) => {
          if (error?.httpStatus) {
            throw error;
          }
          throw error;
        });

      const motorcycle = await getMotorcycleSaleRecord(companyId, motorcycleId);
      return res.json(motorcycle);
    }),
  );
}
