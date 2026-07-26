import type { Express, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireNonPOS } from "../auth";
import { db } from "../db";
import { asyncHandler } from "../lib/asyncHandler";

const motorcycleStatuses = ["IN_STOCK", "RESERVED", "SOLD", "IN_SERVICE", "DAMAGED"] as const;

const nullableText = (maxLength: number) => z.string().trim().max(maxLength).nullable().optional();
const nullableId = z.number().int().positive().nullable().optional();
const nullableDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD")
  .nullable()
  .optional();
const nullableMoney = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a non-negative number with up to 2 decimals")
  .nullable()
  .optional();

const motorcycleInputSchema = z
  .object({
    brand: z.string().trim().min(1, "Brand is required").max(100),
    bikeModel: z.string().trim().min(1, "Model is required").max(200),
    color: nullableText(50),
    engineNumber: z.string().trim().min(1, "Engine number is required").max(100),
    chassisNumber: z.string().trim().min(1, "Chassis number is required").max(100),
    modelYear: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1)
      .nullable()
      .optional(),
    purchaseCost: nullableMoney,
    sellingPrice: nullableMoney,
    locationId: nullableId,
    status: z.enum(motorcycleStatuses).default("IN_STOCK"),
    supplierId: nullableId,
    containerId: nullableId,
    customerId: nullableId,
    saleDate: nullableDate,
    invoiceNumber: nullableText(100),
    warrantyStartDate: nullableDate,
    warrantyEndDate: nullableDate,
    notes: nullableText(2000),
  })
  .superRefine((value, ctx) => {
    if (value.status === "SOLD") {
      if (!value.customerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerId"],
          message: "A sold motorcycle must have a customer",
        });
      }
      if (!value.saleDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["saleDate"],
          message: "A sold motorcycle must have a sale date",
        });
      }
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

type MotorcycleInput = z.infer<typeof motorcycleInputSchema>;

function companyIdFrom(req: Request, res: Response): number | null {
  const companyId = req.session.currentCompanyId;
  if (!companyId) {
    res.status(400).json({ message: "No company selected" });
    return null;
  }
  return companyId;
}

function cleanText(value: string | null | undefined): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

async function referenceValidationError(
  companyId: number,
  input: MotorcycleInput,
): Promise<string | null> {
  if (input.customerId) {
    const result = await db.execute(sql`
      SELECT 1
      FROM customers
      WHERE id = ${input.customerId}
        AND company_id = ${companyId}
        AND deleted_at IS NULL
      LIMIT 1
    `);
    if (result.rows.length === 0) return "Customer does not belong to the selected company";
  }

  if (input.locationId) {
    const result = await db.execute(sql`
      SELECT 1
      FROM locations
      WHERE id = ${input.locationId}
        AND company_id = ${companyId}
        AND deleted_at IS NULL
      LIMIT 1
    `);
    if (result.rows.length === 0) return "Location does not belong to the selected company";
  }

  if (input.supplierId) {
    const result = await db.execute(sql`
      SELECT 1
      FROM suppliers
      WHERE id = ${input.supplierId}
        AND company_id = ${companyId}
        AND deleted_at IS NULL
      LIMIT 1
    `);
    if (result.rows.length === 0) return "Supplier does not belong to the selected company";
  }

  if (input.containerId) {
    const result = await db.execute(sql`
      SELECT 1
      FROM containers
      WHERE id = ${input.containerId}
        AND company_id = ${companyId}
      LIMIT 1
    `);
    if (result.rows.length === 0) return "Container does not belong to the selected company";
  }

  return null;
}

async function getMotorcycle(companyId: number, id: number) {
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
      bp.notes,
      bp.created_at AS "createdAt",
      bp.updated_at AS "updatedAt",
      c.legal_name AS "customerName",
      l.name AS "locationName",
      s.legal_name AS "supplierName",
      co.container_number AS "containerNumber"
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
    WHERE bp.id = ${id}
      AND bp.company_id = ${companyId}
      AND bp.deleted_at IS NULL
    LIMIT 1
  `);

  return result.rows[0] ?? null;
}

export function registerMotorcycleRecordRoutes(app: Express): void {
  app.get(
    "/api/motorcycles",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;

      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
      const locationId =
        typeof req.query.locationId === "string" && req.query.locationId
          ? Number(req.query.locationId)
          : null;

      if (status && !motorcycleStatuses.includes(status as (typeof motorcycleStatuses)[number])) {
        return res.status(400).json({ message: "Invalid motorcycle status" });
      }
      if (locationId !== null && (!Number.isInteger(locationId) || locationId <= 0)) {
        return res.status(400).json({ message: "Invalid location" });
      }

      const conditions = [sql`bp.company_id = ${companyId}`, sql`bp.deleted_at IS NULL`];
      if (status) conditions.push(sql`bp.status = ${status}`);
      if (locationId) conditions.push(sql`bp.location_id = ${locationId}`);
      if (q) {
        const pattern = `%${q}%`;
        conditions.push(sql`(
          bp.brand ILIKE ${pattern}
          OR bp.bike_model ILIKE ${pattern}
          OR bp.engine_number ILIKE ${pattern}
          OR bp.chassis_number ILIKE ${pattern}
          OR bp.invoice_number ILIKE ${pattern}
          OR c.legal_name ILIKE ${pattern}
          OR co.container_number ILIKE ${pattern}
        )`);
      }

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
          bp.notes,
          bp.created_at AS "createdAt",
          bp.updated_at AS "updatedAt",
          c.legal_name AS "customerName",
          l.name AS "locationName",
          s.legal_name AS "supplierName",
          co.container_number AS "containerNumber"
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
        WHERE ${sql.join(conditions, sql` AND `)}
        ORDER BY
          CASE bp.status
            WHEN 'IN_STOCK' THEN 1
            WHEN 'RESERVED' THEN 2
            WHEN 'IN_SERVICE' THEN 3
            WHEN 'DAMAGED' THEN 4
            WHEN 'SOLD' THEN 5
            ELSE 6
          END,
          bp.brand,
          bp.bike_model,
          bp.id DESC
      `);

      return res.json(result.rows);
    }),
  );

  app.post(
    "/api/motorcycles",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;

      const parsed = motorcycleInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid data" });
      }

      const input = parsed.data;
      const referenceError = await referenceValidationError(companyId, input);
      if (referenceError) return res.status(400).json({ message: referenceError });

      try {
        const result = await db.execute(sql`
          INSERT INTO bike_purchases (
            company_id,
            customer_id,
            brand,
            bike_model,
            color,
            engine_number,
            chassis_number,
            model_year,
            purchase_cost,
            selling_price,
            location_id,
            status,
            supplier_id,
            container_id,
            sale_date,
            invoice_number,
            warranty_start_date,
            warranty_end_date,
            notes,
            created_at,
            updated_at
          ) VALUES (
            ${companyId},
            ${input.customerId ?? null},
            ${input.brand.trim()},
            ${input.bikeModel.trim()},
            ${cleanText(input.color)},
            ${input.engineNumber.trim()},
            ${input.chassisNumber.trim()},
            ${input.modelYear ?? null},
            ${input.purchaseCost ?? null},
            ${input.sellingPrice ?? null},
            ${input.locationId ?? null},
            ${input.status},
            ${input.supplierId ?? null},
            ${input.containerId ?? null},
            ${input.saleDate ?? null},
            ${cleanText(input.invoiceNumber)},
            ${input.warrantyStartDate ?? null},
            ${input.warrantyEndDate ?? null},
            ${cleanText(input.notes)},
            now(),
            now()
          )
          RETURNING id
        `);

        const id = Number(result.rows[0]?.id);
        const motorcycle = await getMotorcycle(companyId, id);
        return res.status(201).json(motorcycle);
      } catch (error: any) {
        if (error?.code === "23505") {
          return res.status(409).json({
            message: "Engine number or chassis number already exists for this company",
          });
        }
        throw error;
      }
    }),
  );

  app.put(
    "/api/motorcycles/:id",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;

      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid motorcycle ID" });
      }

      const parsed = motorcycleInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid data" });
      }

      const input = parsed.data;
      const referenceError = await referenceValidationError(companyId, input);
      if (referenceError) return res.status(400).json({ message: referenceError });

      try {
        const result = await db.execute(sql`
          UPDATE bike_purchases
          SET
            customer_id = ${input.customerId ?? null},
            brand = ${input.brand.trim()},
            bike_model = ${input.bikeModel.trim()},
            color = ${cleanText(input.color)},
            engine_number = ${input.engineNumber.trim()},
            chassis_number = ${input.chassisNumber.trim()},
            model_year = ${input.modelYear ?? null},
            purchase_cost = ${input.purchaseCost ?? null},
            selling_price = ${input.sellingPrice ?? null},
            location_id = ${input.locationId ?? null},
            status = ${input.status},
            supplier_id = ${input.supplierId ?? null},
            container_id = ${input.containerId ?? null},
            sale_date = ${input.saleDate ?? null},
            invoice_number = ${cleanText(input.invoiceNumber)},
            warranty_start_date = ${input.warrantyStartDate ?? null},
            warranty_end_date = ${input.warrantyEndDate ?? null},
            notes = ${cleanText(input.notes)},
            updated_at = now()
          WHERE id = ${id}
            AND company_id = ${companyId}
            AND deleted_at IS NULL
          RETURNING id
        `);

        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Motorcycle not found" });
        }

        const motorcycle = await getMotorcycle(companyId, id);
        return res.json(motorcycle);
      } catch (error: any) {
        if (error?.code === "23505") {
          return res.status(409).json({
            message: "Engine number or chassis number already exists for this company",
          });
        }
        throw error;
      }
    }),
  );

  app.delete(
    "/api/motorcycles/:id",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;

      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid motorcycle ID" });
      }

      const result = await db.execute(sql`
        UPDATE bike_purchases
        SET deleted_at = now(), updated_at = now()
        WHERE id = ${id}
          AND company_id = ${companyId}
          AND deleted_at IS NULL
        RETURNING id
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Motorcycle not found" });
      }

      return res.status(204).send();
    }),
  );
}
