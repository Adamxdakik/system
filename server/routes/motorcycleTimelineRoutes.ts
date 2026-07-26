import type { Express } from "express";
import { sql } from "drizzle-orm";
import { requireAuth, requireNonPOS } from "../auth";
import { db } from "../db";
import { asyncHandler } from "../lib/asyncHandler";
import { lifecycleNeedsAttention } from "../services/motorcycles/lifecyclePolicy";
import { companyIdFrom, getMotorcycle, positiveId } from "../services/motorcycles/lifecycleQueries";

type TimelineEvent = {
  id: string;
  type: "registry" | "sale" | "service" | "warranty" | "communication" | "assembly";
  date: string;
  title: string;
  description: string;
};

type ServiceTimelineRow = {
  id: number;
  date: string;
  serviceType: string | null;
  mileage: number | null;
  partsUsed: string | null;
  technicianName: string | null;
  notes: string | null;
};

type WarrantyTimelineRow = {
  id: number;
  date: string;
  warrantyDuration: number | null;
  warrantyStatus: string | null;
  voidReason: string | null;
  notes: string | null;
};

type CommunicationTimelineRow = {
  id: number;
  date: string;
  contactType: string | null;
  notes: string | null;
};

type AssemblyTimelineRow = {
  id: number;
  date: string;
  stockItemName: string | null;
  fromStage: string | null;
  toStage: string | null;
  technician: string | null;
  locationName: string | null;
};

export function registerMotorcycleTimelineRoutes(app: Express): void {
  app.get(
    "/api/motorcycles/:id/timeline",
    requireAuth,
    requireNonPOS,
    asyncHandler(async (req, res) => {
      const companyId = companyIdFrom(req, res);
      if (!companyId) return;
      const motorcycleId = positiveId(req.params.id);
      if (!motorcycleId) return res.status(400).json({ message: "Invalid motorcycle ID" });

      const motorcycle = await getMotorcycle(companyId, motorcycleId);
      if (!motorcycle) return res.status(404).json({ message: "Motorcycle not found" });

      const [serviceResult, warrantyResult, communicationResult, assemblyResult] =
        await Promise.all([
          db.execute(sql`
          SELECT
            id,
            service_date AS date,
            service_type AS "serviceType",
            mileage,
            parts_used AS "partsUsed",
            technician_name AS "technicianName",
            notes
          FROM service_history
          WHERE company_id = ${companyId}
            AND motorcycle_id = ${motorcycleId}
            AND deleted_at IS NULL
          ORDER BY service_date DESC, id DESC
        `),
          db.execute(sql`
          SELECT
            id,
            warranty_start_date AS date,
            warranty_duration AS "warrantyDuration",
            warranty_status AS "warrantyStatus",
            void_reason AS "voidReason",
            notes
          FROM warranties
          WHERE company_id = ${companyId}
            AND motorcycle_id = ${motorcycleId}
            AND deleted_at IS NULL
          ORDER BY warranty_start_date DESC, id DESC
        `),
          db.execute(sql`
          SELECT
            id,
            contact_date AS date,
            contact_type AS "contactType",
            notes
          FROM communication_logs
          WHERE company_id = ${companyId}
            AND motorcycle_id = ${motorcycleId}
            AND deleted_at IS NULL
          ORDER BY contact_date DESC, id DESC
        `),
          db.execute(sql`
          SELECT
            ah.id,
            ah.created_at AS date,
            ah.stock_item_name AS "stockItemName",
            ah.from_stage AS "fromStage",
            ah.to_stage AS "toStage",
            ah.technician,
            l.name AS "locationName"
          FROM assembly_history_motorcycles link
          JOIN assembly_history ah
            ON ah.id = link.assembly_history_id
            AND ah.company_id = link.company_id
          LEFT JOIN locations l
            ON l.id = ah.location_id
            AND l.company_id = ah.company_id
          WHERE link.company_id = ${companyId}
            AND link.motorcycle_id = ${motorcycleId}
          ORDER BY ah.created_at DESC, ah.id DESC
        `),
        ]);

      const serviceRows = serviceResult.rows as ServiceTimelineRow[];
      const warrantyRows = warrantyResult.rows as WarrantyTimelineRow[];
      const communicationRows = communicationResult.rows as CommunicationTimelineRow[];
      const assemblyRows = assemblyResult.rows as AssemblyTimelineRow[];

      const events: TimelineEvent[] = [
        {
          id: `registry-${motorcycle.id}`,
          type: "registry",
          date: motorcycle.createdAt,
          title: "Motorcycle registered",
          description: [motorcycle.brand, motorcycle.bikeModel].filter(Boolean).join(" "),
        },
      ];

      if (motorcycle.saleDate) {
        events.push({
          id: `sale-${motorcycle.id}`,
          type: "sale",
          date: motorcycle.saleDate,
          title: "Motorcycle sold",
          description: [motorcycle.customerName, motorcycle.invoiceNumber]
            .filter(Boolean)
            .join(" · "),
        });
      }

      for (const row of serviceRows) {
        events.push({
          id: `service-${row.id}`,
          type: "service",
          date: row.date,
          title: row.serviceType || "Service",
          description: [
            row.mileage != null ? `${row.mileage} km` : null,
            row.technicianName,
            row.partsUsed,
            row.notes,
          ]
            .filter(Boolean)
            .join(" · "),
        });
      }

      for (const row of warrantyRows) {
        events.push({
          id: `warranty-${row.id}`,
          type: "warranty",
          date: row.date,
          title: `Warranty ${row.warrantyStatus || "record"}`,
          description: [
            row.warrantyDuration != null ? `${row.warrantyDuration} months` : null,
            row.voidReason,
            row.notes,
          ]
            .filter(Boolean)
            .join(" · "),
        });
      }

      for (const row of communicationRows) {
        events.push({
          id: `communication-${row.id}`,
          type: "communication",
          date: row.date,
          title: row.contactType || "Communication",
          description: row.notes || "Customer contact recorded",
        });
      }

      for (const row of assemblyRows) {
        events.push({
          id: `assembly-${row.id}`,
          type: "assembly",
          date: row.date,
          title: "Assembly completed",
          description: [
            row.stockItemName,
            row.fromStage && row.toStage ? `${row.fromStage} → ${row.toStage}` : null,
            row.locationName,
            row.technician,
          ]
            .filter(Boolean)
            .join(" · "),
        });
      }

      events.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

      const serviceCount = serviceRows.length;
      const activeWarrantyCount = warrantyRows.filter(
        (row) => row.warrantyStatus === "Active",
      ).length;
      const today = new Date().toISOString().slice(0, 10);

      return res.json({
        motorcycle,
        summary: {
          serviceCount,
          warrantyCount: warrantyRows.length,
          activeWarrantyCount,
          communicationCount: communicationRows.length,
          assemblyLinked: assemblyRows.length > 0,
          needsAttention: lifecycleNeedsAttention({
            status: motorcycle.status,
            serviceCount,
            activeWarrantyCount,
            warrantyEndDate: motorcycle.warrantyEndDate,
            today,
          }),
        },
        events,
      });
    }),
  );
}
