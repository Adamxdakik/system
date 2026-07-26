import type { Express } from "express";
import { sql } from "drizzle-orm";
import { requireAuth, requireNonPOS } from "../auth";
import { db } from "../db";
import { asyncHandler } from "../lib/asyncHandler";
import { companyIdFrom } from "../services/motorcycles/lifecycleQueries";

export function registerMotorcycleLifecycleOverviewRoutes(app: Express): void {
  app.get(
    "/api/motorcycle-lifecycle/overview",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;

      const result = await db.execute(sql`
        SELECT
          bp.id AS "motorcycleId",
          COALESCE(service_stats.count, 0)::integer AS "serviceCount",
          COALESCE(warranty_stats.count, 0)::integer AS "warrantyCount",
          COALESCE(warranty_stats."activeCount", 0)::integer AS "activeWarrantyCount",
          COALESCE(communication_stats.count, 0)::integer AS "communicationCount",
          COALESCE(assembly_stats.count, 0) > 0 AS "assemblyLinked",
          (
            (bp.status = 'IN_SERVICE' AND COALESCE(service_stats.count, 0) = 0)
            OR (
              COALESCE(warranty_stats."activeCount", 0) > 0
              AND bp.warranty_end_date IS NOT NULL
              AND bp.warranty_end_date < CURRENT_DATE
            )
          ) AS "needsAttention"
        FROM bike_purchases bp
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS count
          FROM service_history sh
          WHERE sh.company_id = bp.company_id
            AND sh.motorcycle_id = bp.id
            AND sh.deleted_at IS NULL
        ) service_stats ON true
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*) AS count,
            COUNT(*) FILTER (WHERE warranty_status = 'Active') AS "activeCount"
          FROM warranties w
          WHERE w.company_id = bp.company_id
            AND w.motorcycle_id = bp.id
            AND w.deleted_at IS NULL
        ) warranty_stats ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS count
          FROM communication_logs cl
          WHERE cl.company_id = bp.company_id
            AND cl.motorcycle_id = bp.id
            AND cl.deleted_at IS NULL
        ) communication_stats ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS count
          FROM assembly_history_motorcycles ahm
          WHERE ahm.company_id = bp.company_id
            AND ahm.motorcycle_id = bp.id
        ) assembly_stats ON true
        WHERE bp.company_id = ${companyId}
          AND bp.deleted_at IS NULL
        ORDER BY bp.id
      `);

      return res.json(result.rows);
    }),
  );
}
