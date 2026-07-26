import type { Express, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireNonPOS } from "../auth";
import { db } from "../db";
import { asyncHandler } from "../lib/asyncHandler";
import { canRegisterAssemblyUnit } from "../services/motorcycles/lifecyclePolicy";
import {
  cleanText,
  companyIdFrom,
  getMotorcycle,
  positiveId,
  routeError,
  sendRouteError,
} from "../services/motorcycles/lifecycleQueries";

const nullableText = (maxLength: number) => z.string().trim().max(maxLength).nullable().optional();
const nullableMoney = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Amount must have up to 2 decimals")
  .nullable()
  .optional();

const assemblyRegistrationSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required").max(100),
  bikeModel: z.string().trim().max(200).nullable().optional(),
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
  notes: nullableText(2000),
});

export function registerMotorcycleAssemblyLifecycleRoutes(app: Express): void {
  app.get(
    "/api/motorcycle-assembly/available",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;
      const result = await db.execute(sql`
        SELECT
          ah.id,
          ah.location_id AS "locationId",
          l.name AS "locationName",
          ah.stock_item_id AS "stockItemId",
          ah.stock_item_name AS "stockItemName",
          ah.from_stage AS "fromStage",
          ah.to_stage AS "toStage",
          ABS(ah.qty_changed)::integer AS "completedQuantity",
          COALESCE(linked."linkedCount", 0)::integer AS "linkedCount",
          (ABS(ah.qty_changed) - COALESCE(linked."linkedCount", 0))::integer AS "remainingUnits",
          ah.technician,
          ah.username,
          ah.created_at AS "createdAt"
        FROM assembly_history ah
        LEFT JOIN locations l
          ON l.id = ah.location_id
          AND l.company_id = ah.company_id
          AND l.deleted_at IS NULL
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS "linkedCount"
          FROM assembly_history_motorcycles ahm
          WHERE ahm.company_id = ah.company_id
            AND ahm.assembly_history_id = ah.id
        ) linked ON true
        WHERE ah.company_id = ${companyId}
          AND COALESCE(ah.completed, false) = true
          AND ah.to_stage = 'Final Product'
          AND ABS(ah.qty_changed) > COALESCE(linked."linkedCount", 0)
        ORDER BY ah.created_at DESC, ah.id DESC
      `);
      return res.json(result.rows);
    }),
  );

  app.post(
    "/api/motorcycle-assembly/:historyId/register",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;
      const historyId = positiveId(req.params.historyId);
      if (!historyId) return res.status(400).json({ message: "Invalid assembly history ID" });
      const parsed = assemblyRegistrationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: parsed.error.issues[0]?.message ?? "Invalid motorcycle" });
      }

      try {
        let motorcycleId = 0;
        await db.transaction(async (tx) => {
          const historyResult = await tx.execute(sql`
            SELECT
              id,
              location_id AS "locationId",
              stock_item_name AS "stockItemName",
              to_stage AS "toStage",
              qty_changed AS "qtyChanged",
              COALESCE(completed, false) AS completed
            FROM assembly_history
            WHERE id = ${historyId}
              AND company_id = ${companyId}
            FOR UPDATE
          `);
          const history = historyResult.rows[0] as
            | {
                id: number;
                locationId: number;
                stockItemName: string | null;
                toStage: string | null;
                qtyChanged: number;
                completed: boolean;
              }
            | undefined;
          if (!history) throw routeError("Assembly history record not found", 404);

          const linkCountResult = await tx.execute(sql`
            SELECT COUNT(*)::integer AS count
            FROM assembly_history_motorcycles
            WHERE company_id = ${companyId}
              AND assembly_history_id = ${historyId}
          `);
          const linkedCount = Number(linkCountResult.rows[0]?.count ?? 0);
          if (
            !canRegisterAssemblyUnit({
              completed: history.completed,
              toStage: history.toStage,
              qtyChanged: Number(history.qtyChanged),
              linkedCount,
            })
          ) {
            throw routeError(
              "This assembly record has no completed Final Product units left to register",
              409,
              "ASSEMBLY_CAPACITY_EXHAUSTED",
            );
          }

          const input = parsed.data;
          const model = cleanText(input.bikeModel) || history.stockItemName;
          if (!model) throw routeError("Motorcycle model is required", 400);
          const notes = [`Registered from assembly history #${historyId}`, cleanText(input.notes)]
            .filter(Boolean)
            .join(" · ");

          const motorcycleResult = await tx.execute(sql`
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
              notes,
              created_at,
              updated_at
            ) VALUES (
              ${companyId},
              NULL,
              ${input.brand},
              ${model},
              ${cleanText(input.color)},
              ${input.engineNumber},
              ${input.chassisNumber},
              ${input.modelYear ?? null},
              ${input.purchaseCost ?? null},
              ${input.sellingPrice ?? null},
              ${history.locationId},
              'IN_STOCK',
              ${notes},
              now(),
              now()
            )
            RETURNING id
          `);
          motorcycleId = Number(motorcycleResult.rows[0]?.id);

          await tx.execute(sql`
            INSERT INTO assembly_history_motorcycles (
              company_id,
              assembly_history_id,
              motorcycle_id,
              created_by_user_id,
              created_at
            ) VALUES (
              ${companyId},
              ${historyId},
              ${motorcycleId},
              ${req.session.userId ?? null},
              now()
            )
          `);
        });

        const motorcycle = await getMotorcycle(companyId, motorcycleId);
        return res.status(201).json(motorcycle);
      } catch (error: unknown) {
        const typedError = error as { code?: string };
        if (typedError.code === "23505") {
          return res.status(409).json({
            message: "Engine or chassis number is already registered",
            code: "DUPLICATE_MOTORCYCLE_IDENTITY",
          });
        }
        if (sendRouteError(res, error)) return;
        throw error;
      }
    }),
  );

  app.patch(
    "/api/assembly-history/:id",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res, next: NextFunction) => {
      if (req.body?.completed !== false) return next();
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;
      const historyId = positiveId(req.params.id);
      if (!historyId) return res.status(400).json({ message: "Invalid assembly history ID" });

      const result = await db.execute(sql`
        SELECT COUNT(*)::integer AS count
        FROM assembly_history_motorcycles
        WHERE company_id = ${companyId}
          AND assembly_history_id = ${historyId}
      `);
      if (Number(result.rows[0]?.count ?? 0) > 0) {
        return res.status(409).json({
          message: "Registered motorcycles must be unlinked before this assembly output can reopen",
          code: "ASSEMBLY_OUTPUT_REGISTERED",
        });
      }
      return next();
    }),
  );
}
