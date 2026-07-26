import { beforeEach, describe, expect, it } from "vitest";
import {
  BandwidthTelemetry,
  getBandwidthTelemetryReport,
  normalizeBandwidthPath,
  recordBandwidthSample,
  resetBandwidthTelemetryForTests,
} from "../services/observability/bandwidthTelemetry";

describe("bandwidth telemetry", () => {
  beforeEach(() => {
    resetBandwidthTelemetryForTests(0);
  });

  it("normalizes dynamic path identifiers without keeping query strings", () => {
    expect(normalizeBandwidthPath("/api/vouchers/123?include=entries")).toBe(
      "/api/vouchers/:id",
    );
    expect(
      normalizeBandwidthPath(
        "/api/jobs/550e8400-e29b-41d4-a716-446655440000/results/abcdef1234567890",
      ),
    ).toBe("/api/jobs/:id/results/:id");
    expect(normalizeBandwidthPath("/not-api/123")).toBe("/api/:unknown");
  });

  it("aggregates response bytes, request frequency, latency, and errors", () => {
    const telemetry = new BandwidthTelemetry({
      heavyResponseBytes: 1_024,
      slowRequestMillis: 100,
      windowMinutes: 5,
    });
    const now = 10 * 60_000;

    telemetry.record({
      method: "GET",
      path: "/api/accounts/42",
      statusCode: 200,
      durationMillis: 120,
      responseBytes: 2_048,
      observedAt: now,
    });
    telemetry.record({
      method: "GET",
      path: "/api/accounts/77",
      statusCode: 500,
      durationMillis: 20,
      responseBytes: null,
      observedAt: now + 1_000,
    });

    const report = telemetry.snapshot(10, now + 2_000);
    expect(report.totals).toMatchObject({
      requestCount: 2,
      requestsLastWindow: 2,
      knownLengthCount: 1,
      unknownLengthCount: 1,
      knownLengthPercent: 50,
      totalResponseBytes: 2_048,
      responseBytesLastWindow: 2_048,
      heavyResponseCount: 1,
      slowRequestCount: 1,
      errorCount: 1,
      routeCount: 1,
    });
    expect(report.routes[0]).toMatchObject({
      method: "GET",
      path: "/api/accounts/:id",
      requestCount: 2,
      requestsLastWindow: 2,
      errorCount: 1,
      averageResponseBytes: 2_048,
      maxResponseBytes: 2_048,
      averageDurationMillis: 70,
      maxDurationMillis: 120,
      heavyResponseCount: 1,
      slowRequestCount: 1,
    });
  });

  it("keeps only the configured rolling window", () => {
    const telemetry = new BandwidthTelemetry({ windowMinutes: 5 });
    const currentMinute = 20;

    telemetry.record({
      method: "GET",
      path: "/api/stock-items",
      statusCode: 200,
      durationMillis: 10,
      responseBytes: 1_000,
      observedAt: (currentMinute - 5) * 60_000,
    });
    telemetry.record({
      method: "GET",
      path: "/api/stock-items",
      statusCode: 200,
      durationMillis: 10,
      responseBytes: 2_000,
      observedAt: currentMinute * 60_000,
    });

    const route = telemetry.snapshot(10, currentMinute * 60_000).routes[0];
    expect(route.requestCount).toBe(2);
    expect(route.totalResponseBytes).toBe(3_000);
    expect(route.requestsLastWindow).toBe(1);
    expect(route.responseBytesLastWindow).toBe(2_000);
  });

  it("bounds route cardinality and uses an overflow bucket", () => {
    const telemetry = new BandwidthTelemetry({ maxRoutes: 10 });

    for (let index = 0; index < 20; index += 1) {
      telemetry.record({
        method: "GET",
        path: `/api/report-${index}`,
        statusCode: 200,
        durationMillis: 1,
        responseBytes: 10,
        observedAt: 60_000,
      });
    }

    const report = telemetry.snapshot(20, 60_000);
    expect(report.totals.routeCount).toBeLessThanOrEqual(10);
    expect(report.routes.some((route) => route.path === "/api/:overflow")).toBe(true);
    expect(report.totals.requestCount).toBe(20);
  });

  it("exposes privacy-safe process-local reporting only", () => {
    recordBandwidthSample({
      method: "GET",
      path: "/api/customers/123?token=secret",
      statusCode: 200,
      durationMillis: 5,
      responseBytes: 128,
      observedAt: 1_000,
    });

    const report = getBandwidthTelemetryReport(10);
    expect(report).toMatchObject({
      processLocal: true,
      privacy: {
        responseBodiesCollected: false,
        queryStringsCollected: false,
        userIdsCollected: false,
        companyIdsCollected: false,
      },
    });
    expect(JSON.stringify(report)).not.toContain("token=secret");
    expect(JSON.stringify(report)).not.toContain("customers/123");
  });
});
