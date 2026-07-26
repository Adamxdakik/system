import express, { type Express, type RequestHandler } from "express";
import { createServer, type Server } from "http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  apiBandwidthMetrics,
  getApiBandwidthSnapshot,
  registerBandwidthMetricsRoutes,
  resetApiBandwidthMetricsForTests,
} from "../bandwidthMetrics";
import { requestIdMiddleware } from "../httpSafety";

const openServers = new Set<Server>();
const pass: RequestHandler = (_req, _res, next) => next();

beforeEach(() => {
  resetApiBandwidthMetricsForTests();
});

afterEach(async () => {
  await Promise.all(
    [...openServers].map(
      (server) =>
        new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        ),
    ),
  );
  openServers.clear();
});

async function listen(app: Express): Promise<string> {
  const server = createServer(app);
  openServers.add(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port");
  }
  return `http://127.0.0.1:${address.port}`;
}

function metricsApp(): Express {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(apiBandwidthMetrics());
  return app;
}

describe("production bandwidth metrics", () => {
  it("measures response bytes and aggregates dynamic IDs by route template", async () => {
    const app = metricsApp();
    app.get("/api/items/:id", (req, res) => {
      res.json({ id: req.params.id, payload: "x".repeat(128) });
    });

    const baseUrl = await listen(app);
    await fetch(`${baseUrl}/api/items/101`);
    await fetch(`${baseUrl}/api/items/202`);

    const snapshot = getApiBandwidthSnapshot(5);
    expect(snapshot.totals.requestCount).toBe(2);
    expect(snapshot.totals.responseBytes).toBeGreaterThan(256);
    expect(snapshot.routes).toHaveLength(1);
    expect(snapshot.routes[0]).toMatchObject({
      method: "GET",
      route: "/api/items/:id",
      requestCount: 2,
    });
    expect(snapshot.routes[0].averageResponseBytes).toBeGreaterThan(128);
  });

  it("does not collect static assets or the metrics endpoint itself", async () => {
    const app = metricsApp();
    app.get("/assets/app.js", (_req, res) => res.type("text/javascript").send("bundle"));
    registerBandwidthMetricsRoutes(app, pass, pass);

    const baseUrl = await listen(app);
    await fetch(`${baseUrl}/assets/app.js`);
    const response = await fetch(`${baseUrl}/api/admin/bandwidth-metrics?windowMinutes=5`);

    expect(response.status).toBe(200);
    const payload = (await response.json()) as ReturnType<typeof getApiBandwidthSnapshot>;
    expect(payload.windowMinutes).toBe(5);
    expect(payload.totals.requestCount).toBe(0);
    expect(payload.routes).toEqual([]);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects invalid windows and caps valid windows to retention", async () => {
    const app = metricsApp();
    registerBandwidthMetricsRoutes(app, pass, pass);
    const baseUrl = await listen(app);

    const invalid = await fetch(
      `${baseUrl}/api/admin/bandwidth-metrics?windowMinutes=not-a-number`,
      { headers: { "X-Request-ID": "bandwidth-invalid" } },
    );
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({
      message: "windowMinutes must be a positive number",
      requestId: "bandwidth-invalid",
    });

    const capped = await fetch(`${baseUrl}/api/admin/bandwidth-metrics?windowMinutes=999`);
    expect(capped.status).toBe(200);
    expect((await capped.json()).windowMinutes).toBe(15);
  });
});
