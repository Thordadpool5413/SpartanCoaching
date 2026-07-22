import assert from "node:assert/strict";
import test from "node:test";
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
  assert.equal(state.status, 410);
  assert.deepEqual(state.body, {
    error: "Legacy roleplay has been retired while tenant-safe roleplay is being introduced.",
    code: "LEGACY_ROLEPLAY_RETIRED",
  });
});
