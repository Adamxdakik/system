import express, { type Express } from "express";
import fs from "fs";
import { createServer, type Server } from "http";
import path from "path";
import multer from "multer";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiRequestLogger,
  applicationHealthPayload,
  databaseHealthPayload,
  errorHandler,
  MULTIPART_FILE_LIMIT_BYTES,
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
  it("returns the exact healthy and degraded database health contracts", () => {
    expect(databaseHealthPayload("ok", "unused")).toEqual({
      status: "ok",
      db: "ok",
    });
    expect(databaseHealthPayload("down", "health-request")).toEqual({
      status: "degraded",
      db: "down",
      requestId: "health-request",
    });
  });

  it("includes operational metadata without environment or database details", () => {
    const healthy = applicationHealthPayload("ok", "unused");
    const degraded = applicationHealthPayload("down", "health-request");

    expect(healthy).toMatchObject({
      status: "ok",
      db: "ok",
      uptimeSeconds: expect.any(Number),
      timestamp: expect.any(String),
      version: expect.any(String),
    });
    expect(healthy).not.toHaveProperty("requestId");
    expect(degraded).toMatchObject({
      status: "degraded",
      db: "down",
      requestId: "health-request",
    });
    for (const payload of [healthy, degraded]) {
      expect(payload).not.toHaveProperty("error");
      expect(payload).not.toHaveProperty("hostname");
      expect(payload).not.toHaveProperty("nodeEnv");
    }
  });

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

  it("accepts colons and request IDs up to 100 characters", async () => {
    const { app } = safetyApp();
    app.get("/api/example", (req, res) => res.json({ id: req.requestId }));
    const requestId = `trace:${"a".repeat(94)}`;

    const response = await fetch(`${await listen(app)}/api/example`, {
      headers: { "X-Request-ID": requestId },
    });

    expect(response.headers.get("x-request-id")).toBe(requestId);
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

  it("replaces request IDs longer than 100 characters", async () => {
    const { app } = safetyApp();
    app.get("/api/example", (req, res) => res.json({ id: req.requestId }));

    const response = await fetch(`${await listen(app)}/api/example`, {
      headers: { "X-Request-ID": "a".repeat(101) },
    });
    const body = (await response.json()) as { id: string };

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
    const entry = JSON.parse(message);
    expect(entry).toMatchObject({
      requestId: "log-test",
      method: "GET",
      path: "/api/secret",
      statusCode: 200,
    });
    expect(entry.durationMillis).toEqual(expect.any(Number));
    expect(Object.keys(entry).sort()).toEqual(
      ["contentLength", "durationMillis", "method", "path", "requestId", "statusCode"].sort(),
    );
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
    ["application/json", JSON.stringify({ value: "x".repeat(2 * 1024 * 1024) })],
    [
      "application/x-www-form-urlencoded",
      new URLSearchParams({ value: "x".repeat(2 * 1024 * 1024) }).toString(),
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
      message: "Request payload too large",
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
  const routesSource = fs.readFileSync(path.resolve(import.meta.dirname, "../routes.ts"), "utf8");

  it("preserves the shared 10 MB Multer file limit", () => {
    expect(MULTIPART_FILE_LIMIT_BYTES).toBe(10 * 1024 * 1024);
    expect(routesSource).toContain("fileSize: MULTIPART_FILE_LIMIT_BYTES");
  });

  function uploadApp() {
    const app = express();
    app.use(requestIdMiddleware);
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: MULTIPART_FILE_LIMIT_BYTES },
    });
    app.post("/api/upload", upload.single("file"), (req, res) => {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      return res.json({ filename: req.file.originalname, size: req.file.size });
    });
    app.use(errorHandler);
    return app;
  }

  it("accepts multipart files below 10 MB independently of JSON limits", async () => {
    const form = new FormData();
    form.set("file", new Blob([Buffer.alloc(2 * 1024 * 1024 + 1)]), "fixture.xlsx");

    const response = await fetch(`${await listen(uploadApp())}/api/upload`, {
      method: "POST",
      body: form,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      filename: "fixture.xlsx",
      size: 2 * 1024 * 1024 + 1,
    });
  });

  it("returns a controlled response for multipart files above 10 MB", async () => {
    const form = new FormData();
    form.set("file", new Blob([Buffer.alloc(10 * 1024 * 1024 + 1)]), "too-large.xlsx");

    const response = await fetch(`${await listen(uploadApp())}/api/upload`, {
      method: "POST",
      headers: { "X-Request-ID": "upload-limit" },
      body: form,
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      message: "Request payload too large",
      requestId: "upload-limit",
    });
  });

  it("keeps the existing missing-file validation shape", async () => {
    const response = await fetch(`${await listen(uploadApp())}/api/upload`, {
      method: "POST",
      body: new FormData(),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "No file uploaded" });
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
      const uploadOffset = routesSource.indexOf('upload.single("file")', routeOffset);
      expect(routeOffset, `${route} should remain registered`).toBeGreaterThan(-1);
      expect(uploadOffset, `${route} should remain handled by Multer`).toBeGreaterThan(routeOffset);
      expect(uploadOffset - routeOffset).toBeLessThan(250);
    }

    expect(routesSource.match(/upload\.single\("file"\)/g)).toHaveLength(5);
  });
});
