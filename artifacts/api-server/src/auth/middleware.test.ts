import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Response } from "express";
import {
  isAdminRequest,
  requireAdmin,
  type AdminAuthorizationRequest,
} from "./adminAuthorization.ts";

function responseRecorder() {
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
  return { response, state };
}

test("admin header cannot authorize a request", () => {
  const req = { headers: { "x-admin-auth": "5413" } } as unknown as AdminAuthorizationRequest;
  assert.equal(isAdminRequest(req), false);
});

test("active platform admin session is authorized", () => {
  const req = {
    clientMemberId: 7,
    fieldKit: { member: { status: "active", role: "platform_admin" } },
  } as unknown as AdminAuthorizationRequest;
  assert.equal(isAdminRequest(req), true);
});

test("ordinary authenticated member receives forbidden", () => {
  const req = {
    clientMemberId: 8,
    fieldKit: { member: { status: "active", role: "member" } },
  } as unknown as AdminAuthorizationRequest;
  const { response, state } = responseRecorder();
  let called = false;
  requireAdmin(req, response, (() => {
    called = true;
  }) as NextFunction);
  assert.equal(called, false);
  assert.equal(state.status, 403);
  assert.deepEqual(state.body, {
    error: "Platform administrator session required",
    code: "ADMIN_REQUIRED",
  });
});
