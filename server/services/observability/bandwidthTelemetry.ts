export interface BandwidthSample {
  method: string;
  path: string;
  statusCode: number;
  durationMillis: number;
  responseBytes: number | null;
  observedAt?: number;
}

export interface BandwidthTelemetryOptions {
  maxRoutes?: number;
  heavyResponseBytes?: number;
  slowRequestMillis?: number;
  windowMinutes?: number;
}

interface MinuteBucket {
  minute: number;
  requestCount: number;
  responseBytes: number;
}

interface RouteAggregate {
  method: string;
  path: string;
  requestCount: number;
  errorCount: number;
  knownLengthCount: number;
  unknownLengthCount: number;
  totalResponseBytes: number;
  maxResponseBytes: number;
  totalDurationMillis: number;
  maxDurationMillis: number;
  heavyResponseCount: number;
  slowRequestCount: number;
  lastStatusCode: number;
  lastSeenAt: number;
  minuteBuckets: MinuteBucket[];
}

export interface BandwidthRouteSnapshot {
  method: string;
  path: string;
  requestCount: number;
  requestsLastWindow: number;
  requestsPerMinute: number;
  errorCount: number;
  knownLengthCount: number;
  unknownLengthCount: number;
  totalResponseBytes: number;
  responseBytesLastWindow: number;
  responseBytesPerMinute: number;
  averageResponseBytes: number;
  maxResponseBytes: number;
  averageDurationMillis: number;
  maxDurationMillis: number;
  heavyResponseCount: number;
  slowRequestCount: number;
  lastStatusCode: number;
  lastSeenAt: string;
}

export interface BandwidthTelemetrySnapshot {
  generatedAt: string;
  startedAt: string;
  uptimeSeconds: number;
  windowMinutes: number;
  thresholds: {
    heavyResponseBytes: number;
    slowRequestMillis: number;
    maxRoutes: number;
  };
  totals: {
    requestCount: number;
    requestsLastWindow: number;
    requestsPerMinute: number;
    knownLengthCount: number;
    unknownLengthCount: number;
    knownLengthPercent: number;
    totalResponseBytes: number;
    responseBytesLastWindow: number;
    responseBytesPerMinute: number;
    heavyResponseCount: number;
    slowRequestCount: number;
    errorCount: number;
    routeCount: number;
  };
  routes: BandwidthRouteSnapshot[];
}

const DEFAULT_MAX_ROUTES = 250;
const DEFAULT_HEAVY_RESPONSE_BYTES = 250 * 1024;
const DEFAULT_SLOW_REQUEST_MILLIS = 750;
const DEFAULT_WINDOW_MINUTES = 5;
const OVERFLOW_METHOD = "OTHER";
const OVERFLOW_PATH = "/api/:overflow";
const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTEGER_SEGMENT = /^\d+$/;
const LONG_HEX_SEGMENT = /^[0-9a-f]{16,}$/i;

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(value as number)));
}

function environmentInteger(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  return boundedInteger(Number(raw), fallback, minimum, maximum);
}

function rounded(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function normalizeBandwidthPath(path: string): string {
  const pathname = String(path || "/api/:unknown")
    .split("?", 1)[0]
    .slice(0, 500);
  const normalized = pathname
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      if (
        INTEGER_SEGMENT.test(segment) ||
        UUID_SEGMENT.test(segment) ||
        LONG_HEX_SEGMENT.test(segment)
      ) {
        return ":id";
      }
      if (segment.length > 80) return ":value";
      return segment;
    })
    .join("/");
  return normalized.startsWith("/api") ? normalized : "/api/:unknown";
}

export class BandwidthTelemetry {
  private readonly maxRoutes: number;
  private readonly heavyResponseBytes: number;
  private readonly slowRequestMillis: number;
  private readonly windowMinutes: number;
  private readonly routes = new Map<string, RouteAggregate>();
  private startedAt = Date.now();

  constructor(options: BandwidthTelemetryOptions = {}) {
    this.maxRoutes = boundedInteger(options.maxRoutes, DEFAULT_MAX_ROUTES, 10, 2_000);
    this.heavyResponseBytes = boundedInteger(
      options.heavyResponseBytes,
      DEFAULT_HEAVY_RESPONSE_BYTES,
      1_024,
      100 * 1024 * 1024,
    );
    this.slowRequestMillis = boundedInteger(
      options.slowRequestMillis,
      DEFAULT_SLOW_REQUEST_MILLIS,
      50,
      120_000,
    );
    this.windowMinutes = boundedInteger(options.windowMinutes, DEFAULT_WINDOW_MINUTES, 1, 60);
  }

  reset(now = Date.now()): void {
    this.routes.clear();
    this.startedAt = now;
  }

  record(sample: BandwidthSample): void {
    const observedAt = Number.isFinite(sample.observedAt) ? Number(sample.observedAt) : Date.now();
    const method = String(sample.method || "UNKNOWN")
      .toUpperCase()
      .slice(0, 16);
    const normalizedPath = normalizeBandwidthPath(sample.path);
    let aggregateMethod = method;
    let aggregatePath = normalizedPath;
    let key = `${aggregateMethod} ${aggregatePath}`;

    if (!this.routes.has(key) && this.routes.size >= this.maxRoutes - 1) {
      aggregateMethod = OVERFLOW_METHOD;
      aggregatePath = OVERFLOW_PATH;
      key = `${aggregateMethod} ${aggregatePath}`;
    }

    let aggregate = this.routes.get(key);
    if (!aggregate) {
      aggregate = {
        method: aggregateMethod,
        path: aggregatePath,
        requestCount: 0,
        errorCount: 0,
        knownLengthCount: 0,
        unknownLengthCount: 0,
        totalResponseBytes: 0,
        maxResponseBytes: 0,
        totalDurationMillis: 0,
        maxDurationMillis: 0,
        heavyResponseCount: 0,
        slowRequestCount: 0,
        lastStatusCode: 0,
        lastSeenAt: observedAt,
        minuteBuckets: [],
      };
      this.routes.set(key, aggregate);
    }

    const durationMillis = Math.max(0, Number(sample.durationMillis) || 0);
    const responseBytes =
      sample.responseBytes !== null && Number.isFinite(sample.responseBytes)
        ? Math.max(0, Math.floor(sample.responseBytes))
        : null;

    aggregate.requestCount += 1;
    aggregate.totalDurationMillis += durationMillis;
    aggregate.maxDurationMillis = Math.max(aggregate.maxDurationMillis, durationMillis);
    aggregate.lastStatusCode = Number(sample.statusCode) || 0;
    aggregate.lastSeenAt = observedAt;

    if (aggregate.lastStatusCode >= 400) aggregate.errorCount += 1;
    if (durationMillis >= this.slowRequestMillis) aggregate.slowRequestCount += 1;

    if (responseBytes === null) {
      aggregate.unknownLengthCount += 1;
    } else {
      aggregate.knownLengthCount += 1;
      aggregate.totalResponseBytes += responseBytes;
      aggregate.maxResponseBytes = Math.max(aggregate.maxResponseBytes, responseBytes);
      if (responseBytes >= this.heavyResponseBytes) aggregate.heavyResponseCount += 1;
    }

    this.recordMinuteBucket(aggregate, observedAt, responseBytes ?? 0);
  }

  snapshot(limit = 50, now = Date.now()): BandwidthTelemetrySnapshot {
    const routeLimit = boundedInteger(limit, 50, 1, this.maxRoutes);
    const routeSnapshots = [...this.routes.values()].map((aggregate) =>
      this.routeSnapshot(aggregate, now),
    );
    routeSnapshots.sort(
      (left, right) =>
        right.responseBytesLastWindow - left.responseBytesLastWindow ||
        right.totalResponseBytes - left.totalResponseBytes ||
        right.requestsLastWindow - left.requestsLastWindow ||
        left.path.localeCompare(right.path),
    );

    const totals = routeSnapshots.reduce(
      (summary, route) => {
        summary.requestCount += route.requestCount;
        summary.requestsLastWindow += route.requestsLastWindow;
        summary.knownLengthCount += route.knownLengthCount;
        summary.unknownLengthCount += route.unknownLengthCount;
        summary.totalResponseBytes += route.totalResponseBytes;
        summary.responseBytesLastWindow += route.responseBytesLastWindow;
        summary.heavyResponseCount += route.heavyResponseCount;
        summary.slowRequestCount += route.slowRequestCount;
        summary.errorCount += route.errorCount;
        return summary;
      },
      {
        requestCount: 0,
        requestsLastWindow: 0,
        knownLengthCount: 0,
        unknownLengthCount: 0,
        totalResponseBytes: 0,
        responseBytesLastWindow: 0,
        heavyResponseCount: 0,
        slowRequestCount: 0,
        errorCount: 0,
      },
    );
    const observedCount = totals.knownLengthCount + totals.unknownLengthCount;

    return {
      generatedAt: new Date(now).toISOString(),
      startedAt: new Date(this.startedAt).toISOString(),
      uptimeSeconds: Math.max(0, Math.floor((now - this.startedAt) / 1_000)),
      windowMinutes: this.windowMinutes,
      thresholds: {
        heavyResponseBytes: this.heavyResponseBytes,
        slowRequestMillis: this.slowRequestMillis,
        maxRoutes: this.maxRoutes,
      },
      totals: {
        ...totals,
        requestsPerMinute: rounded(totals.requestsLastWindow / this.windowMinutes),
        knownLengthPercent:
          observedCount === 0 ? 100 : rounded((totals.knownLengthCount / observedCount) * 100),
        responseBytesPerMinute: rounded(totals.responseBytesLastWindow / this.windowMinutes),
        routeCount: routeSnapshots.length,
      },
      routes: routeSnapshots.slice(0, routeLimit),
    };
  }

  private recordMinuteBucket(
    aggregate: RouteAggregate,
    observedAt: number,
    responseBytes: number,
  ): void {
    const minute = Math.floor(observedAt / 60_000);
    const latest = aggregate.minuteBuckets.at(-1);
    if (latest?.minute === minute) {
      latest.requestCount += 1;
      latest.responseBytes += responseBytes;
    } else {
      aggregate.minuteBuckets.push({ minute, requestCount: 1, responseBytes });
    }
    const oldestAllowedMinute = minute - this.windowMinutes + 1;
    while (
      aggregate.minuteBuckets.length > 0 &&
      aggregate.minuteBuckets[0].minute < oldestAllowedMinute
    ) {
      aggregate.minuteBuckets.shift();
    }
  }

  private routeSnapshot(aggregate: RouteAggregate, now: number): BandwidthRouteSnapshot {
    const currentMinute = Math.floor(now / 60_000);
    const oldestAllowedMinute = currentMinute - this.windowMinutes + 1;
    const recent = aggregate.minuteBuckets.filter((bucket) => bucket.minute >= oldestAllowedMinute);
    const requestsLastWindow = recent.reduce((total, bucket) => total + bucket.requestCount, 0);
    const responseBytesLastWindow = recent.reduce(
      (total, bucket) => total + bucket.responseBytes,
      0,
    );

    return {
      method: aggregate.method,
      path: aggregate.path,
      requestCount: aggregate.requestCount,
      requestsLastWindow,
      requestsPerMinute: rounded(requestsLastWindow / this.windowMinutes),
      errorCount: aggregate.errorCount,
      knownLengthCount: aggregate.knownLengthCount,
      unknownLengthCount: aggregate.unknownLengthCount,
      totalResponseBytes: aggregate.totalResponseBytes,
      responseBytesLastWindow,
      responseBytesPerMinute: rounded(responseBytesLastWindow / this.windowMinutes),
      averageResponseBytes:
        aggregate.knownLengthCount === 0
          ? 0
          : rounded(aggregate.totalResponseBytes / aggregate.knownLengthCount),
      maxResponseBytes: aggregate.maxResponseBytes,
      averageDurationMillis:
        aggregate.requestCount === 0
          ? 0
          : rounded(aggregate.totalDurationMillis / aggregate.requestCount),
      maxDurationMillis: aggregate.maxDurationMillis,
      heavyResponseCount: aggregate.heavyResponseCount,
      slowRequestCount: aggregate.slowRequestCount,
      lastStatusCode: aggregate.lastStatusCode,
      lastSeenAt: new Date(aggregate.lastSeenAt).toISOString(),
    };
  }
}

const telemetryDisabled = process.env.DISABLE_BANDWIDTH_TELEMETRY === "true";
const bandwidthTelemetry = new BandwidthTelemetry({
  maxRoutes: environmentInteger("BANDWIDTH_TELEMETRY_MAX_ROUTES", DEFAULT_MAX_ROUTES, 10, 2_000),
  heavyResponseBytes: environmentInteger(
    "BANDWIDTH_HEAVY_RESPONSE_BYTES",
    DEFAULT_HEAVY_RESPONSE_BYTES,
    1_024,
    100 * 1024 * 1024,
  ),
  slowRequestMillis: environmentInteger(
    "BANDWIDTH_SLOW_REQUEST_MILLIS",
    DEFAULT_SLOW_REQUEST_MILLIS,
    50,
    120_000,
  ),
  windowMinutes: environmentInteger(
    "BANDWIDTH_TELEMETRY_WINDOW_MINUTES",
    DEFAULT_WINDOW_MINUTES,
    1,
    60,
  ),
});

export function recordBandwidthSample(sample: BandwidthSample): void {
  if (telemetryDisabled) return;
  bandwidthTelemetry.record(sample);
}

export function getBandwidthTelemetryReport(limit?: number) {
  return {
    enabled: !telemetryDisabled,
    processLocal: true,
    privacy: {
      responseBodiesCollected: false,
      queryStringsCollected: false,
      userIdsCollected: false,
      companyIdsCollected: false,
    },
    ...bandwidthTelemetry.snapshot(limit),
  };
}

export function resetBandwidthTelemetryForTests(now?: number): void {
  bandwidthTelemetry.reset(now);
}
