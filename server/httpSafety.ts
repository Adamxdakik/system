import { randomUUID } from "crypto";
import express, { type ErrorRequestHandler, type RequestHandler } from "express";

export const JSON_BODY_LIMIT = "2mb";
export const URL_ENCODED_BODY_LIMIT = "2mb";
export const MULTIPART_FILE_LIMIT_BYTES = 10 * 1024 * 1024;

export function databaseHealthPayload(dbStatus: "ok" | "down", requestId: string) {
  return dbStatus === "ok"
    ? { status: "ok" as const, db: "ok" as const }
    : {
        status: "degraded" as const,
        db: "down" as const,
        requestId,
      };
}

export function applicationHealthPayload(dbStatus: "ok" | "down", requestId: string) {
  return {
    status: dbStatus === "ok" ? ("ok" as const) : ("degraded" as const),
    db: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version:
      process.env.BUILD_VERSION || process.env.RENDER_GIT_COMMIT?.substring(0, 8) || "unknown",
    ...(dbStatus === "down" ? { requestId } : {}),
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,100}$/;

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const suppliedRequestId = req.get("x-request-id");
  req.requestId =
    suppliedRequestId && SAFE_REQUEST_ID.test(suppliedRequestId) ? suppliedRequestId : randomUUID();
  res.setHeader("X-Request-ID", req.requestId);
  next();
};

export function requestBodyParsers(): RequestHandler[] {
  return [
    express.json({
      limit: JSON_BODY_LIMIT,
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
    express.urlencoded({
      extended: false,
      limit: URL_ENCODED_BODY_LIMIT,
    }),
  ];
}

export function apiRequestLogger(writeLog: (message: string) => void): RequestHandler {
  return (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      if (req.path.startsWith("/api")) {
        const contentLength = res.getHeader("content-length");
        const entry: Record<string, string | number> = {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMillis: Date.now() - start,
        };

        if (contentLength !== undefined) {
          entry.contentLength = String(contentLength);
        }
        if (req.user?.id) {
          entry.userId = req.user.id;
        } else if (req.session?.userId) {
          entry.userId = req.session.userId;
        }
        if (req.session?.currentCompanyId !== undefined) {
          entry.currentCompanyId = req.session.currentCompanyId;
        }

        writeLog(JSON.stringify(entry));
      }
    });

    next();
  };
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err?.name === "ZodError" && Array.isArray(err.errors)) {
    return res.status(400).json({
      message: "Invalid request",
      errors: err.errors.map((issue: any) => ({
        path: Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path ?? ""),
        message: issue.message,
        code: issue.code,
      })),
      requestId: req.requestId,
    });
  }

  if (err?.type === "entity.too.large" || err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "Request payload too large",
      requestId: req.requestId,
    });
  }

  const status = Number(err?.status || err?.statusCode) || 500;
  if (status >= 500) {
    console.error(`[error-middleware] requestId=${req.requestId}`, err);
    return res.status(status).json({
      message: "Internal Server Error",
      requestId: req.requestId,
    });
  }

  const payload: Record<string, unknown> = {
    message: err?.message || "Request failed",
    requestId: req.requestId,
  };
  if (err?.code) payload.code = err.code;
  if (err?.requiresConfirmation !== undefined) {
    payload.requiresConfirmation = err.requiresConfirmation;
  }
  if (err?.employeeBalance !== undefined) {
    payload.employeeBalance = err.employeeBalance;
  }
  if (err?.ledgerBalance !== undefined) {
    payload.ledgerBalance = err.ledgerBalance;
  }
  return res.status(status).json(payload);
};
