import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

// Validates `req[source]` against the given Zod schema and forwards any
// ZodError to the central error middleware (which formats it as a 400 with
// structured field errors). On success, the parsed (and optionally coerced)
// value replaces `req[source]`.
export function validate(schema: ZodSchema, source: Source = "body"): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      (req as unknown as Record<string, unknown>)[source] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}
