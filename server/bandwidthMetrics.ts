import type { Express, Request, RequestHandler } from "express";
import { requireAuth, requireRole } from "./auth";

export const BANDWIDTH_METRIC_RETENTION_MINUTES = 15;
export const BANDWIDTH_METRIC_MAX_SAMPLES = 10_000;
export const LARGE_RESPONSE_BYTES = 512 * 1024;

interface ApiBandwidthSample {
  timestampMillis: number;
  method: string;
  route: string;
  statusCode: number;
  responseBytes: number;
  durationMillis: number;
}

interface RouteBandwidthSummary {
  method: string;
  route: string;
  requestCount: number;
  requestsPerMinute: number;
  responseBytes: number;
  averageResponseBytes: number;
  maxResponseBytes: number;
  largeResponseCount: number;
  serverErrorCount: number;
  averageDurationMillis: number;
  maxDurationMillis: number;
}

const samples: ApiBandwidthSample[] = [];
const processStartedAt = new Date().toISOString();

function chunkByteLength(chunk: unknown, encoding?: BufferEncoding): number {
  if (chunk === undefined || chunk === null) return 0;
  if (Buffer.isBuffer(chunk)) return chunk.length;
  if (chunk instanceof Uint8Array) return chunk.byteLength;
  if (typeof chunk === "string") return Buffer.byteLength(chunk, encoding);
  return 0;
}

function normalizeFallbackPath(path: string): string {
  return path
    .replace(/\/[0-9]+(?=\/|$)/g, "/:id")
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
      "/:id",
    )
    .replace(/\/[0-9a-f]{16,}(?=\/|$)/gi, "/:id");
}

function routeTemplate(req: Request): string {
  const routePath = req.route?.path;
  if (typeof routePath === "string") {
    return `${req.baseUrl || ""}${routePath}` || req.path;
  }
  return normalizeFallbackPath(req.path);
}

function pruneSamples(nowMillis: number): void {
  const cutoff = nowMillis - BANDWIDTH_METRIC_RETENTION_MINUTES * 60_000;
  while (samples.length > 0 && samples[0].timestampMillis < cutoff) {
    samples.shift();
  }
  if (samples.length > BANDWIDTH_METRIC_MAX_SAMPLES) {
    samples.splice(0, samples.length - BANDWIDTH_METRIC_MAX_SAMPLES);
  }
}

function recordSample(sample: ApiBandwidthSample): void {
  samples.push(sample);
  pruneSamples(sample.timestampMillis);
}

export function resetApiBandwidthMetricsForTests(): void {
  samples.length = 0;
}

export function apiBandwidthMetrics(): RequestHandler {
  return (req, res, next) => {
    if (!req.path.startsWith("/api")) {
      next();
      return;
    }

    const startedAt = Date.now();
    let responseBytes = 0;
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function writeWithBandwidthCount(
      chunk: any,
      encodingOrCallback?: BufferEncoding | (() => void),
      callback?: () => void,
    ) {
      responseBytes += chunkByteLength(
        chunk,
        typeof encodingOrCallback === "string" ? encodingOrCallback : undefined,
      );
      return (originalWrite as any).call(this, chunk, encodingOrCallback, callback);
    } as typeof res.write;

    res.end = function endWithBandwidthCount(
      chunk?: any,
      encodingOrCallback?: BufferEncoding | (() => void),
      callback?: () => void,
    ) {
      responseBytes += chunkByteLength(
        chunk,
        typeof encodingOrCallback === "string" ? encodingOrCallback : undefined,
      );
      return (originalEnd as any).call(this, chunk, encodingOrCallback, callback);
    } as typeof res.end;

    res.once("finish", () => {
      if (req.path === "/api/admin/bandwidth-metrics") return;

      const contentLength = Number(res.getHeader("content-length"));
      const measuredBytes =
        responseBytes > 0
          ? responseBytes
          : Number.isFinite(contentLength) && contentLength >= 0
            ? contentLength
            : 0;

      recordSample({
        timestampMillis: Date.now(),
        method: req.method,
        route: routeTemplate(req),
        statusCode: res.statusCode,
        responseBytes: measuredBytes,
        durationMillis: Date.now() - startedAt,
      });
    });

    next();
  };
}

export function getApiBandwidthSnapshot(windowMinutes = BANDWIDTH_METRIC_RETENTION_MINUTES) {
  const nowMillis = Date.now();
  const boundedWindowMinutes = Math.min(
    BANDWIDTH_METRIC_RETENTION_MINUTES,
    Math.max(1, Math.floor(windowMinutes)),
  );
  const cutoff = nowMillis - boundedWindowMinutes * 60_000;
  pruneSamples(nowMillis);

  const included = samples.filter((sample) => sample.timestampMillis >= cutoff);
  const routeGroups = new Map<string, RouteBandwidthSummary>();

  for (const sample of included) {
    const key = `${sample.method} ${sample.route}`;
    const existing = routeGroups.get(key) || {
      method: sample.method,
      route: sample.route,
      requestCount: 0,
      requestsPerMinute: 0,
      responseBytes: 0,
      averageResponseBytes: 0,
      maxResponseBytes: 0,
      largeResponseCount: 0,
      serverErrorCount: 0,
      averageDurationMillis: 0,
      maxDurationMillis: 0,
    };

    existing.requestCount += 1;
    existing.responseBytes += sample.responseBytes;
    existing.maxResponseBytes = Math.max(existing.maxResponseBytes, sample.responseBytes);
    existing.largeResponseCount += sample.responseBytes >= LARGE_RESPONSE_BYTES ? 1 : 0;
    existing.serverErrorCount += sample.statusCode >= 500 ? 1 : 0;
    existing.averageDurationMillis += sample.durationMillis;
    existing.maxDurationMillis = Math.max(existing.maxDurationMillis, sample.durationMillis);
    routeGroups.set(key, existing);
  }

  const routes = [...routeGroups.values()]
    .map((route) => ({
      ...route,
      requestsPerMinute: Number((route.requestCount / boundedWindowMinutes).toFixed(2)),
      averageResponseBytes:
        route.requestCount === 0 ? 0 : Math.round(route.responseBytes / route.requestCount),
      averageDurationMillis:
        route.requestCount === 0
          ? 0
          : Number((route.averageDurationMillis / route.requestCount).toFixed(2)),
    }))
    .sort((left, right) =>
      right.responseBytes === left.responseBytes
        ? right.requestCount - left.requestCount
        : right.responseBytes - left.responseBytes,
    )
    .slice(0, 50);

  const totalResponseBytes = included.reduce((total, sample) => total + sample.responseBytes, 0);
  const totalDurationMillis = included.reduce((total, sample) => total + sample.durationMillis, 0);

  return {
    capturedAt: new Date(nowMillis).toISOString(),
    processStartedAt,
    windowMinutes: boundedWindowMinutes,
    retentionMinutes: BANDWIDTH_METRIC_RETENTION_MINUTES,
    processLocal: true,
    resetsOnDeploy: true,
    sampleCapacity: BANDWIDTH_METRIC_MAX_SAMPLES,
    totals: {
      requestCount: included.length,
      requestsPerMinute: Number((included.length / boundedWindowMinutes).toFixed(2)),
      responseBytes: totalResponseBytes,
      averageResponseBytes:
        included.length === 0 ? 0 : Math.round(totalResponseBytes / included.length),
      largeResponseCount: included.filter((sample) => sample.responseBytes >= LARGE_RESPONSE_BYTES)
        .length,
      serverErrorCount: included.filter((sample) => sample.statusCode >= 500).length,
      averageDurationMillis:
        included.length === 0
          ? 0
          : Number((totalDurationMillis / included.length).toFixed(2)),
    },
    routes,
  };
}

export function registerBandwidthMetricsRoutes(
  app: Express,
  authMiddleware: RequestHandler = requireAuth,
  adminMiddleware: RequestHandler = requireRole("Admin"),
): void {
  app.get(
    "/api/admin/bandwidth-metrics",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
      const rawWindow = Array.isArray(req.query.windowMinutes)
        ? req.query.windowMinutes[0]
        : req.query.windowMinutes;
      const requestedWindow = rawWindow === undefined ? BANDWIDTH_METRIC_RETENTION_MINUTES : Number(rawWindow);

      if (!Number.isFinite(requestedWindow) || requestedWindow <= 0) {
        return res.status(400).json({
          message: "windowMinutes must be a positive number",
          requestId: req.requestId,
        });
      }

      res.setHeader("Cache-Control", "no-store");
      return res.json(getApiBandwidthSnapshot(requestedWindow));
    },
  );
}
