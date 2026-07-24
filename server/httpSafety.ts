import { randomUUID } from "crypto";
import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";

export const JSON_BODY_LIMIT = "1mb";
export const URL_ENCODED_BODY_LIMIT = "1mb";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const suppliedRequestId = req.get("x-request-id");
  req.requestId =
    suppliedRequestId && SAFE_REQUEST_ID.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
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

export function apiRequestLogger(
  writeLog: (message: string) => void,
): RequestHandler {
  return (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      if (req.path.startsWith("/api")) {
        const duration = Date.now() - start;
        writeLog(
          `${req.method} ${req.path} ${res.statusCode} in ${duration}ms requestId=${req.requestId}`,
        );
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
        path: Array.isArray(issue.path)
          ? issue.path.join(".")
          : String(issue.path ?? ""),
        message: issue.message,
        code: issue.code,
      })),
      requestId: req.requestId,
    });
  }

  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      message: "Request body too large",
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
  return res.status(status).json(payload);
};
