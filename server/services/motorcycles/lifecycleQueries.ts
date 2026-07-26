import type { Request, Response } from "express";
import { sql } from "drizzle-orm";
import { db } from "../../db";

export type MotorcycleLifecycleRow = {
  id: number;
  companyId: number;
  customerId: number | null;
  customerName: string | null;
  brand: string | null;
  bikeModel: string;
  color: string | null;
  engineNumber: string | null;
  chassisNumber: string | null;
  modelYear: number | null;
  purchaseCost: string | null;
  sellingPrice: string | null;
  locationId: number | null;
  locationName: string | null;
  status: string;
  saleDate: string | null;
  invoiceNumber: string | null;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
  createdAt: string;
};

export function companyIdFrom(req: Request, res: Response): number | null {
  const companyId = req.session.currentCompanyId;
  if (!companyId) {
    res.status(400).json({ message: "No company selected" });
    return null;
  }
  return companyId;
}

export function positiveId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function cleanText(value: string | null | undefined): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

export function routeError(message: string, httpStatus: number, code?: string): Error {
  return Object.assign(new Error(message), { httpStatus, code });
}

export function sendRouteError(res: Response, error: unknown): boolean {
  const typed = error as { httpStatus?: number; code?: string; message?: string };
  if (!typed?.httpStatus) return false;
  res.status(typed.httpStatus).json({
    message: typed.message ?? "Request failed",
    ...(typed.code ? { code: typed.code } : {}),
  });
  return true;
}

export async function getMotorcycle(
  companyId: number,
  motorcycleId: number,
): Promise<MotorcycleLifecycleRow | null> {
  const result = await db.execute(sql`
    SELECT
      bp.id,
      bp.company_id AS "companyId",
      bp.customer_id AS "customerId",
      c.legal_name AS "customerName",
      bp.brand,
      bp.bike_model AS "bikeModel",
      bp.color,
      bp.engine_number AS "engineNumber",
      bp.chassis_number AS "chassisNumber",
      bp.model_year AS "modelYear",
      bp.purchase_cost AS "purchaseCost",
      bp.selling_price AS "sellingPrice",
      bp.location_id AS "locationId",
      l.name AS "locationName",
      bp.status,
      bp.sale_date AS "saleDate",
      bp.invoice_number AS "invoiceNumber",
      bp.warranty_start_date AS "warrantyStartDate",
      bp.warranty_end_date AS "warrantyEndDate",
      bp.created_at AS "createdAt"
    FROM bike_purchases bp
    LEFT JOIN customers c
      ON c.id = bp.customer_id
      AND c.company_id = bp.company_id
      AND c.deleted_at IS NULL
    LEFT JOIN locations l
      ON l.id = bp.location_id
      AND l.company_id = bp.company_id
      AND l.deleted_at IS NULL
    WHERE bp.id = ${motorcycleId}
      AND bp.company_id = ${companyId}
      AND bp.deleted_at IS NULL
    LIMIT 1
  `);
  return (result.rows[0] as MotorcycleLifecycleRow | undefined) ?? null;
}

export async function requireOwnedMotorcycle(
  companyId: number,
  motorcycleId: number,
): Promise<MotorcycleLifecycleRow> {
  const motorcycle = await getMotorcycle(companyId, motorcycleId);
  if (!motorcycle) throw routeError("Motorcycle not found", 404, "MOTORCYCLE_NOT_FOUND");
  if (!motorcycle.customerId) {
    throw routeError(
      "This motorcycle must be linked to its customer before adding workshop records",
      409,
      "MOTORCYCLE_CUSTOMER_REQUIRED",
    );
  }
  return motorcycle;
}
