import express, { type Express } from "express";
import fs from "fs";
import { createServer, type Server } from "http";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiRequestLogger,
  errorHandler,
  requestBodyParsers,
  requestIdMiddleware,
} from "../httpSafety";

const openServers = new Set<Server>();

afterEach(async () => {
  vi.restoreAllMocks();
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

function safetyApp(log = vi.fn()) {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(requestBodyParsers());
  app.use(apiRequestLogger(log));
  return { app, log };
}

describe("HTTP safety middleware", () => {
  it("propagates a safe request ID to the response and request", async () => {
    const { app } = safetyApp();
    app.get("/api/example", (req, res) => {
      res.json({ requestId: req.requestId });
    });

    const response = await fetch(`${await listen(app)}/api/example`, {
      headers: { "X-Request-Id": "upstream-123" },
    });

    expect(response.headers.get("x-request-id")).toBe("upstream-123");
    expect(await response.json()).toEqual({ requestId: "upstream-123" });
  });

  it("replaces request IDs outside the safe allowlist", async () => {
    const { app } = safetyApp();
    app.get("/api/example", (req, res) => res.json({ id: req.requestId }));

    const response = await fetch(`${await listen(app)}/api/example`, {
      headers: { "X-Request-Id": "unsafe/id" },
    });
    const body = (await response.json()) as { id: string };

    expect(body.id).not.toBe("unsafe/id");
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("logs request metadata without logging API response bodies", async () => {
    const { app, log } = safetyApp();
    app.get("/api/secret", (_req, res) => {
      res.json({ token: "must-not-appear-in-logs" });
    });

    await fetch(`${await listen(app)}/api/secret`, {
      headers: { "X-Request-Id": "log-test" },
    });
    await vi.waitFor(() => expect(log).toHaveBeenCalledOnce());

    const message = log.mock.calls[0][0] as string;
    expect(message).toContain("GET /api/secret 200");
    expect(message).toContain("requestId=log-test");
    expect(message).not.toContain("must-not-appear-in-logs");
  });

  it("sanitizes unexpected server errors and returns the request ID", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { app } = safetyApp();
    app.get("/api/failure", () => {
      throw new Error("database password is secret");
    });
    app.use(errorHandler);

    const response = await fetch(`${await listen(app)}/api/failure`, {
      headers: { "X-Request-Id": "failure-test" },
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Internal Server Error",
      requestId: "failure-test",
    });
  });

  it.each([
    ["application/json", JSON.stringify({ value: "x".repeat(1024 * 1024) })],
    [
      "application/x-www-form-urlencoded",
      new URLSearchParams({ value: "x".repeat(1024 * 1024) }).toString(),
    ],
  ])("limits %s request bodies", async (contentType, body) => {
    const { app } = safetyApp();
    app.post("/api/body", (_req, res) => res.sendStatus(204));
    app.use(errorHandler);

    const response = await fetch(`${await listen(app)}/api/body`, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "X-Request-Id": "limit-test",
      },
      body,
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      message: "Request body too large",
      requestId: "limit-test",
    });
  });

  it("leaves multipart requests available to upload middleware", async () => {
    const { app } = safetyApp();
    app.post("/api/upload", (_req, res) => res.status(204).end());

    const form = new FormData();
    form.set("file", new Blob(["spreadsheet"]), "import.xlsx");
    const response = await fetch(`${await listen(app)}/api/upload`, {
      method: "POST",
      body: form,
    });

    expect(response.status).toBe(204);
  });
});

describe("upload limit compatibility", () => {
  const routesSource = fs.readFileSync(
    path.resolve(import.meta.dirname, "../routes.ts"),
    "utf8",
  );

  it("preserves the shared 10 MB Multer file limit", () => {
    expect(routesSource).toMatch(/fileSize:\s*10\s*\*\s*1024\s*\*\s*1024/);
  });

  it("keeps all current import routes on multipart upload middleware", () => {
    const uploadRoutes = [
      "/api/companies/:id/moto-rates/import.csv",
      "/api/po-import/parse",
      "/api/pos-import/parse",
      "/api/stock-transfer-import/parse",
      "/api/stock-transfer-import/parse-multi-source",
    ];

    for (const route of uploadRoutes) {
      const routeOffset = routesSource.indexOf(`"${route}"`);
      const uploadOffset = routesSource.indexOf(
        'upload.single("file")',
        routeOffset,
      );
      expect(routeOffset, `${route} should remain registered`).toBeGreaterThan(
        -1,
      );
      expect(
        uploadOffset,
        `${route} should remain handled by Multer`,
      ).toBeGreaterThan(routeOffset);
      expect(uploadOffset - routeOffset).toBeLessThan(250);
    }

    expect(routesSource.match(/upload\.single\("file"\)/g)).toHaveLength(5);
  });
});
