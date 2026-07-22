import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { configuredOrigins, isAllowedOrigin, requireTrustedMutationOrigin } from "./requestSecurity.ts";

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

test("production origin allowlist is explicit", () => {
  const env = { NODE_ENV: "production", SITE_URL: "https://spartan.example/path" } as NodeJS.ProcessEnv;
  assert.deepEqual([...configuredOrigins(env)], ["https://spartan.example"]);
  assert.equal(isAllowedOrigin("https://spartan.example", env), true);
  assert.equal(isAllowedOrigin("https://evil.example", env), false);
});

test("rejects cross-origin cookie mutation", () => {
  const oldNodeEnv = process.env.NODE_ENV;
  const oldSiteUrl = process.env.SITE_URL;
  process.env.NODE_ENV = "production";
  process.env.SITE_URL = "https://spartan.example";
  try {
    const req = {
      method: "POST",
      path: "/api/articles",
      cookies: { spartan_session: "ambient-session" },
      headers: { origin: "https://evil.example" },
    } as unknown as Request;
    const { response, state } = responseRecorder();
    let called = false;
    requireTrustedMutationOrigin(req, response, (() => {
      called = true;
    }) as NextFunction);
    assert.equal(called, false);
    assert.equal(state.status, 403);
    assert.deepEqual(state.body, {
      error: "Request origin is not allowed",
      code: "CSRF_ORIGIN_REJECTED",
    });
  } finally {
    if (oldNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = oldNodeEnv;
    if (oldSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = oldSiteUrl;
  }
});

test("bearer-authenticated provider mutation is not treated as cookie CSRF", () => {
  const req = {
    method: "POST",
    path: "/api/provider/webhook",
    cookies: { spartan_session: "also-present" },
    headers: { authorization: "Bearer verified-token", origin: "https://provider.example" },
  } as unknown as Request;
  const { response } = responseRecorder();
  let called = false;
  requireTrustedMutationOrigin(req, response, (() => {
    called = true;
  }) as NextFunction);
  assert.equal(called, true);
});
