import { describe, it, expect, vi } from "vitest";
import { asyncHandler } from "../asyncHandler";
import type { Request, Response, NextFunction } from "express";

describe("asyncHandler", () => {
  it("calls next with the rejected error from an async handler", async () => {
    const err = new Error("boom");
    const handler = asyncHandler(async () => {
      throw err;
    });

    const next = vi.fn() as unknown as NextFunction;
    handler({} as Request, {} as Response, next);
    await new Promise((r) => setImmediate(r));
    expect(next).toHaveBeenCalledWith(err);
  });

  it("does not call next on success", async () => {
    const handler = asyncHandler(async (_req, res) => {
      (res as unknown as { sent: boolean }).sent = true;
    });

    const next = vi.fn() as unknown as NextFunction;
    const res = {} as Response;
    handler({} as Request, res, next);
    await new Promise((r) => setImmediate(r));
    expect(next).not.toHaveBeenCalled();
    expect((res as unknown as { sent: boolean }).sent).toBe(true);
  });
});
