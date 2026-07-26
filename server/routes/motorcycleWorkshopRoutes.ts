import type { Express, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireNonPOS } from "../auth";
import { db } from "../db";
import { asyncHandler } from "../lib/asyncHandler";
import {
  cleanText,
  companyIdFrom,
  positiveId,
  requireOwnedMotorcycle,
  sendRouteError,
} from "../services/motorcycles/lifecycleQueries";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD");
const nullableText = (maxLength: number) => z.string().trim().max(maxLength).nullable().optional();

const serviceInputSchema = z.object({
  serviceDate: isoDate,
  mileage: z.number().int().nonnegative().nullable().optional(),
  serviceType: z.string().trim().min(1, "Service type is required").max(50),
  partsUsed: nullableText(2000),
  technicianName: nullableText(100),
  notes: nullableText(2000),
});

const warrantyInputSchema = z.object({
  warrantyStartDate: isoDate,
  warrantyDuration: z.number().int().min(1).max(120),
  warrantyStatus: z.enum(["Active", "Expired", "Void"]).default("Active"),
  voidReason: nullableText(2000),
  notes: nullableText(2000),
});

const communicationInputSchema = z.object({
  contactDate: isoDate,
  contactType: z.enum(["Call", "WhatsApp"]),
  notes: nullableText(4000),
});

export function registerMotorcycleWorkshopRoutes(app: Express): void {
  app.post(
    "/api/motorcycles/:id/service-records",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;
      const motorcycleId = positiveId(req.params.id);
      if (!motorcycleId) return res.status(400).json({ message: "Invalid motorcycle ID" });
      const parsed = serviceInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: parsed.error.issues[0]?.message ?? "Invalid service" });
      }

      try {
        const motorcycle = await requireOwnedMotorcycle(companyId, motorcycleId);
        const input = parsed.data;
        const result = await db.execute(sql`
          INSERT INTO service_history (
            company_id,
            customer_id,
            motorcycle_id,
            service_date,
            bike_model,
            mileage,
            service_type,
            parts_used,
            technician_name,
            notes,
            created_at
          ) VALUES (
            ${companyId},
            ${motorcycle.customerId},
            ${motorcycleId},
            ${input.serviceDate},
            ${motorcycle.bikeModel},
            ${input.mileage ?? null},
            ${input.serviceType},
            ${cleanText(input.partsUsed)},
            ${cleanText(input.technicianName)},
            ${cleanText(input.notes)},
            now()
          )
          RETURNING id
        `);
        return res.status(201).json({ id: Number(result.rows[0]?.id) });
      } catch (error) {
        if (sendRouteError(res, error)) return;
        throw error;
      }
    }),
  );

  app.post(
    "/api/motorcycles/:id/warranty-records",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;
      const motorcycleId = positiveId(req.params.id);
      if (!motorcycleId) return res.status(400).json({ message: "Invalid motorcycle ID" });
      const parsed = warrantyInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: parsed.error.issues[0]?.message ?? "Invalid warranty" });
      }

      try {
        const motorcycle = await requireOwnedMotorcycle(companyId, motorcycleId);
        const input = parsed.data;
        const result = await db.execute(sql`
          INSERT INTO warranties (
            company_id,
            customer_id,
            motorcycle_id,
            bike_model,
            warranty_start_date,
            warranty_duration,
            warranty_status,
            void_reason,
            notes,
            created_at
          ) VALUES (
            ${companyId},
            ${motorcycle.customerId},
            ${motorcycleId},
            ${motorcycle.bikeModel},
            ${input.warrantyStartDate},
            ${input.warrantyDuration},
            ${input.warrantyStatus},
            ${cleanText(input.voidReason)},
            ${cleanText(input.notes)},
            now()
          )
          RETURNING id
        `);
        return res.status(201).json({ id: Number(result.rows[0]?.id) });
      } catch (error) {
        if (sendRouteError(res, error)) return;
        throw error;
      }
    }),
  );

  app.post(
    "/api/motorcycles/:id/communication-records",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;
      const motorcycleId = positiveId(req.params.id);
      if (!motorcycleId) return res.status(400).json({ message: "Invalid motorcycle ID" });
      const parsed = communicationInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: parsed.error.issues[0]?.message ?? "Invalid communication" });
      }

      try {
        const motorcycle = await requireOwnedMotorcycle(companyId, motorcycleId);
        const input = parsed.data;
        const result = await db.execute(sql`
          INSERT INTO communication_logs (
            company_id,
            customer_id,
            motorcycle_id,
            contact_date,
            contact_type,
            notes,
            created_at
          ) VALUES (
            ${companyId},
            ${motorcycle.customerId},
            ${motorcycleId},
            ${input.contactDate},
            ${input.contactType},
            ${cleanText(input.notes)},
            now()
          )
          RETURNING id
        `);
        return res.status(201).json({ id: Number(result.rows[0]?.id) });
      } catch (error) {
        if (sendRouteError(res, error)) return;
        throw error;
      }
    }),
  );

  app.delete(
    "/api/motorcycles/:id",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res, next: NextFunction) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;
      const motorcycleId = positiveId(req.params.id);
      if (!motorcycleId) return res.status(400).json({ message: "Invalid motorcycle ID" });

      const result = await db.execute(sql`
        SELECT
          EXISTS (
            SELECT 1 FROM service_history
            WHERE company_id = ${companyId}
              AND motorcycle_id = ${motorcycleId}
              AND deleted_at IS NULL
          )
          OR EXISTS (
            SELECT 1 FROM warranties
            WHERE company_id = ${companyId}
              AND motorcycle_id = ${motorcycleId}
              AND deleted_at IS NULL
          )
          OR EXISTS (
            SELECT 1 FROM communication_logs
            WHERE company_id = ${companyId}
              AND motorcycle_id = ${motorcycleId}
              AND deleted_at IS NULL
          )
          OR EXISTS (
            SELECT 1 FROM assembly_history_motorcycles
            WHERE company_id = ${companyId}
              AND motorcycle_id = ${motorcycleId}
          ) AS linked
      `);
      if (Boolean(result.rows[0]?.linked)) {
        return res.status(409).json({
          message: "A motorcycle with lifecycle history cannot be removed from the registry",
          code: "MOTORCYCLE_LIFECYCLE_LOCKED",
        });
      }
      return next();
    }),
  );
}
