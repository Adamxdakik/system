import type { Express } from "express";
import { requireAuth, requireRole } from "../auth";
import { getBandwidthTelemetryReport } from "../services/observability/bandwidthTelemetry";

function reportLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(250, Math.max(1, Math.floor(parsed)));
}

export function registerAdminBandwidthRoutes(app: Express): void {
  app.get(
    "/api/admin/bandwidth-report",
    requireAuth,
    requireRole("Admin"),
    (req, res) => {
      res.setHeader("Cache-Control", "no-store");
      return res.json(getBandwidthTelemetryReport(reportLimit(req.query.limit)));
    },
  );
}
