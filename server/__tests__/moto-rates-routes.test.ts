/**
 * HTTP-level regression tests for the moto-rates endpoints.
 *
 * Hits the running dev server (workflow on port 5000). Asserts:
 *  - The 4 new /moto-rates endpoints are registered AND auth-gated (401 without session).
 *  - The old /bale-rates endpoints are NOT registered (Express returns the SPA fallback HTML).
 */

import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:5000";

const NEW_ENDPOINTS = [
  { method: "GET", path: "/api/employees/1/moto-rates" },
  { method: "PUT", path: "/api/employees/1/moto-rates" },
  { method: "GET", path: "/api/employees/1/moto-pct-rates" },
  { method: "PUT", path: "/api/employees/1/moto-pct-rates" },
];

const OLD_BALE_PATHS = [
  "/api/employees/1/bale-rates",
  "/api/employees/1/bale-pct-rates",
];

async function ping(method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("moto-rates HTTP routes", () => {
  it.each(NEW_ENDPOINTS)(
    "$method $path returns 401 (registered + auth-gated)",
    async ({ method, path }) => {
      const res = await ping(method, path, method === "PUT" ? { rates: [] } : undefined);
      expect(res.status).toBe(401);
      const ct = res.headers.get("content-type") ?? "";
      expect(ct).toMatch(/application\/json/);
      const body = await res.json();
      expect(body).toHaveProperty("message");
    },
  );

  it.each(OLD_BALE_PATHS)("GET %s is NOT a registered API route (no JSON 401/200)", async (path) => {
    const res = await ping("GET", path);
    const ct = res.headers.get("content-type") ?? "";
    // Express SPA fallback returns text/html, NOT application/json.
    // If this ever flips to JSON, someone re-introduced the old endpoint.
    expect(ct).not.toMatch(/application\/json/);
  });
});
