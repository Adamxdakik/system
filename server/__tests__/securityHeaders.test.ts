import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { afterEach, describe, expect, it } from "vitest";
import { requestIdMiddleware } from "../httpSafety";
import { securityHeaders } from "../securityHeaders";

const openServers = new Set<Server>();

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

function headerApp(environment: "development" | "production") {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(securityHeaders(environment));
  app.get("/api/example", (_req, res) => res.json({ ok: true }));
  app.get("/api/download", (_req, res) => {
    res.attachment("report.xlsx").send("workbook");
  });
  return app;
}

describe("security headers", () => {
  it("sets restrictive production headers without breaking API responses", async () => {
    const response = await fetch(`${await listen(headerApp("production"))}/api/example`, {
      headers: { "X-Request-Id": "helmet-test" },
    });
    const csp = response.headers.get("content-security-policy");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("x-request-id")).toBe("helmet-test");
    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("permissions-policy")).toContain("camera=()");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("*");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it("keeps Vite development transport usable without enabling HSTS", async () => {
    const response = await fetch(`${await listen(headerApp("development"))}/api/example`);
    const csp = response.headers.get("content-security-policy");

    expect(response.headers.get("strict-transport-security")).toBeNull();
    expect(csp).toContain("connect-src 'self' ws: wss:");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("*");
  });

  it("preserves attachment response headers", async () => {
    const response = await fetch(`${await listen(headerApp("production"))}/api/download`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain(
      'attachment; filename="report.xlsx"',
    );
    expect(await response.text()).toBe("workbook");
  });
});
