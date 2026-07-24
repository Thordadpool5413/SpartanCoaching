import { test, expect } from "vitest";
import type { Request, Response } from "express";
import { legacyRoleplayRetired } from "./legacyRoleplay.ts";

test("legacy roleplay never exposes an unowned record", () => {
  const state: { status?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      state.status = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    },
  } as unknown as Response;

  legacyRoleplayRetired({} as Request, response);
  expect(state.status).toBe(410);
  expect(state.body).toEqual({
    error: "Legacy roleplay has been retired while tenant-safe roleplay is being introduced.",
    code: "LEGACY_ROLEPLAY_RETIRED",
  });
});
