import { describe, it, expect, vi } from "vitest";
import { z, ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";
import { validate } from "../validate";

function makeReqRes(body: unknown) {
  const req = { body } as Request;
  const res = {} as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next: next as ReturnType<typeof vi.fn> };
}

describe("validate()", () => {
  it("calls next() with no args on success and replaces req.body with the parsed value", () => {
    const schema = z.object({
      name: z.string(),
      age: z.coerce.number(),
    });
    const { req, res, next } = makeReqRes({ name: "Alice", age: "42" });

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: "Alice", age: 42 });
  });

  it("forwards a ZodError to next() when validation fails (does not call next() with no args)", () => {
    const schema = z.object({ name: z.string() });
    const { req, res, next } = makeReqRes({ name: 123 });

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const arg = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg).toBeInstanceOf(ZodError);
  });

  it("supports validating req.query with source='query'", () => {
    const schema = z.object({ page: z.coerce.number() });
    const req = { query: { page: "3" } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    validate(schema, "query")(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as unknown as { query: unknown }).query).toEqual({ page: 3 });
  });

  it("supports validating req.params with source='params'", () => {
    const schema = z.object({ id: z.coerce.number().int().positive() });
    const req = { params: { id: "7" } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    validate(schema, "params")(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as unknown as { params: unknown }).params).toEqual({ id: 7 });
  });
});
