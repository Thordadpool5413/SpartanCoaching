import { test, expect } from "vitest";
import type { NextFunction, Request, Response } from "express";
import {
  applySecurityHeaders,
  configuredOrigins,
  isAllowedOrigin,
  requireTrustedMutationOrigin,
} from "./requestSecurity.ts";

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
  const env = {
    NODE_ENV: "production",
    SITE_URL: "https://spartan.example/path",
  } as NodeJS.ProcessEnv;
  expect([...configuredOrigins(env)]).toEqual(["https://spartan.example"]);
  expect(isAllowedOrigin("https://spartan.example", env)).toBe(true);
  expect(isAllowedOrigin("https://evil.example", env)).toBe(false);
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
    expect(called).toBe(false);
    expect(state.status).toBe(403);
    expect(state.body).toEqual({
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

test("allows an iOS login carrying a stale native session cookie", () => {
  const req = {
    method: "POST",
    path: "/api/auth/login",
    cookies: { spartan_session: "stale-native-session" },
    headers: {
      origin: "null",
      "x-client-platform": "ios",
    },
  } as unknown as Request;
  const { response } = responseRecorder();
  let called = false;
  requireTrustedMutationOrigin(req, response, (() => {
    called = true;
  }) as NextFunction);
  expect(called).toBe(true);
});

test("does not let an iOS header bypass CSRF on other browser mutations", () => {
  const oldNodeEnv = process.env.NODE_ENV;
  const oldSiteUrl = process.env.SITE_URL;
  process.env.NODE_ENV = "production";
  process.env.SITE_URL = "https://spartan.example";
  try {
    const req = {
      method: "POST",
      path: "/api/articles",
      cookies: { spartan_session: "ambient-session" },
      headers: {
        origin: "https://evil.example",
        "x-client-platform": "ios",
      },
    } as unknown as Request;
    const { response, state } = responseRecorder();
    let called = false;
    requireTrustedMutationOrigin(req, response, (() => {
      called = true;
    }) as NextFunction);
    expect(called).toBe(false);
    expect(state.status).toBe(403);
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
    headers: {
      authorization: "Bearer verified-token",
      origin: "https://provider.example",
    },
  } as unknown as Request;
  const { response } = responseRecorder();
  let called = false;
  requireTrustedMutationOrigin(req, response, (() => {
    called = true;
  }) as NextFunction);
  expect(called).toBe(true);
});

test("applies browser hardening headers to public pages and API responses", () => {
  const headers = new Map<string, string>();
  const response = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return this;
    },
  } as unknown as Response;
  let called = false;
  applySecurityHeaders({} as Request, response, (() => {
    called = true;
  }) as NextFunction);
  expect(called).toBe(true);
  expect(headers.get("Content-Security-Policy")).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers.get("Content-Security-Policy")).toContain("frame-src 'none'");
  expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(headers.get("Referrer-Policy")).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(headers.get("Permissions-Policy")).toContain("camera=()");
  expect(headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
});

// Test-only server: the production middleware chain selects the principal.
// Persistence and entitlement refresh are controlled; no production route exists.
import express from "express";
import cookieParser from "cookie-parser";
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, vi } from "vitest";
import {
  loadSession,
  requireAuth,
  type AuthedRequest,
} from "../auth/middleware";
const persistence = vi.hoisted(() => ({ token: "", step: 0 }));
vi.mock("../auth/crypto", async () => {
  const { createHash } = await import("node:crypto");
  return {
    hashToken(token: string) {
      persistence.token = token;
      persistence.step = 0;
      return createHash("sha256").update(token).digest("hex");
    },
  };
});
vi.mock("../db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            const memberId =
              persistence.token === "synthetic-cookie-A"
                ? 101
                : persistence.token === "synthetic-bearer-B"
                  ? 202
                  : null;
            if (memberId === null) return [];
            const step = persistence.step++;
            if (step === 0)
              return [
                {
                  id: memberId + 1,
                  memberId,
                  expiresAt: new Date("2050-01-01T00:00:00Z"),
                },
              ];
            if (step === 1)
              return [
                {
                  id: memberId,
                  organizationId: 7,
                  status: "active",
                  role: "member",
                },
              ];
            return [{ id: 7, status: "active", type: "company" }];
          },
        }),
      }),
    }),
  },
}));
vi.mock("../auth/entitlement", () => ({
  refreshOrgStatus: async (org: unknown) => org,
  evaluateFieldKitAccess: (member: unknown, org: unknown) => ({
    member,
    org,
    allowed: true,
  }),
}));

describe("reserved knowledge-control actual middleware chain", () => {
  let server: Server;
  let base: string;
  beforeAll(async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_URL", "https://synthetic.example.invalid");
    const app = express();
    app.use(cookieParser());
    app.use(requireTrustedMutationOrigin, loadSession, requireAuth);
    app.all(
      [
        "/api/knowledge-control",
        "/api/knowledge-control/example",
        "/api/knowledge-controlx",
        "/api/knowledge-controls",
        "/api/provider/webhook",
        "/api/auth/login",
      ],
      (req: AuthedRequest, res) => res.json({ principal: req.clientMemberId }),
    );
    server = createServer(app);
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("TEST_SERVER_UNAVAILABLE");
    base = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    vi.unstubAllEnvs();
  });
  async function call(
    path: string,
    method = "POST",
    headers: Record<string, string> = {},
  ) {
    const response = await fetch(base + path, { method, headers });
    return {
      status: response.status,
      body:
        method === "HEAD"
          ? null
          : response.headers.get("content-type")?.includes("application/json")
            ? await response.json()
            : await response.text(),
    };
  }
  const cookie = { cookie: "spartan_session=synthetic-cookie-A" };
  const bearer = { authorization: "Bearer synthetic-bearer-B" };
  const trusted = { origin: "https://synthetic.example.invalid" };
  for (const path of [
    "/api/knowledge-control",
    "/api/knowledge-control/",
    "/api/knowledge-control/example",
    "/api/knowledge-control?x=synthetic",
    "/API/KNOWLEDGE-CONTROL",
    "/API/KNOWLEDGE-CONTROL/",
    "/ApI/KnOwLeDgE-CoNtRoL/example",
    "/API/KNOWLEDGE-CONTROL/example?x=synthetic",
  ]) {
    for (const origin of [
      undefined,
      "https://hostile.example.invalid",
      "null",
    ]) {
      test(`cookie plus invalid Bearer and iOS cannot bypass ${path} origin=${origin}`, async () => {
        const r = await call(path, "POST", {
          ...cookie,
          authorization: "Bearer synthetic-invalid",
          "x-client-platform": "ios",
          ...(origin ? { origin } : {}),
        });
        expect(r.status).toBe(403);
        expect(r.body.code).toBe("CSRF_ORIGIN_REJECTED");
      });
    }
    test(`trusted origin preserves cookie-first principal for ${path}`, async () => {
      expect(
        await call(path, "POST", { ...cookie, ...bearer, ...trusted }),
      ).toEqual({ status: 200, body: { principal: 101 } });
    });
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    test(`${method} without origin denies mixed credentials`, async () => {
      expect(
        (
          await call("/api/knowledge-control/example", method, {
            ...cookie,
            ...bearer,
          })
        ).status,
      ).toBe(403);
    });
  }
  for (const method of ["GET", "HEAD", "OPTIONS"]) {
    test(`${method} keeps safe-method handling`, async () => {
      expect(
        (await call("/api/knowledge-control", method, { ...cookie, ...bearer }))
          .status,
      ).toBe(200);
    });
  }
  for (const path of [
    "/api/knowledge-controlx",
    "/api/knowledge-controls",
    "/api/provider/webhook",
    "/api/auth/login",
  ]) {
    test(`legacy mixed-credential behavior preserved at ${path}`, async () => {
      expect(
        await call(path, "POST", {
          ...cookie,
          ...bearer,
          "x-client-platform": "ios",
        }),
      ).toEqual({ status: 200, body: { principal: 101 } });
    });
  }
  test("valid Bearer-only request authenticates B; invalid Bearer remains 401", async () => {
    expect(await call("/api/knowledge-control", "POST", bearer)).toEqual({
      status: 200,
      body: { principal: 202 },
    });
    const denied = await call("/api/knowledge-control", "POST", {
      authorization: "Bearer synthetic-invalid",
    });
    expect(denied.status).toBe(401);
    expect(denied.body.code).toBe("UNAUTHENTICATED");
  });
  test("trusted origin with invalid cookie cannot fall back to Bearer B", async () => {
    expect(
      (
        await call("/api/knowledge-control", "POST", {
          cookie: "spartan_session=synthetic-invalid",
          ...bearer,
          ...trusted,
        })
      ).status,
    ).toBe(401);
  });
  for (const path of [
    "/API/KNOWLEDGE-CONTROL",
    "/ApI/KnOwLeDgE-CoNtRoL/example/",
  ]) {
    for (const credentials of [
      cookie,
      { ...cookie, ...bearer },
      { ...cookie, authorization: "Bearer synthetic-invalid" },
      { ...cookie, authorization: "arbitrary" },
      { ...cookie, "x-client-platform": "ios" },
    ]) {
      for (const origin of [
        undefined,
        "https://hostile.example.invalid",
        trusted.origin,
      ]) {
        test(`H1 named ${path} credentials=${JSON.stringify(credentials)} origin=${origin}`, async () => {
          const result = await call(path, "POST", {
            ...credentials,
            ...(origin ? { origin } : {}),
          });
          expect(result.status).toBe(origin === trusted.origin ? 200 : 403);
          expect(result.body).toEqual(
            origin === trusted.origin
              ? { principal: 101 }
              : {
                  error: "Request origin is not allowed",
                  code: "CSRF_ORIGIN_REJECTED",
                },
          );
        });
      }
    }
    test(`H1 bearer and cookie authentication remain real on ${path}`, async () => {
      expect(await call(path, "POST", bearer)).toEqual({
        status: 200,
        body: { principal: 202 },
      });
      expect(
        (await call(path, "POST", { authorization: "Bearer invalid" })).status,
      ).toBe(401);
      expect(
        (
          await call(path, "POST", {
            ...bearer,
            ...trusted,
            cookie: "spartan_session=invalid",
          })
        ).status,
      ).toBe(401);
      for (const method of ["GET", "HEAD", "OPTIONS"])
        expect((await call(path, method, cookie)).status).toBe(200);
    });
  }
  for (const path of [
    "/api//knowledge-control",
    "/API//knowledge-control",
    "/api/%6Bnowledge-control",
    "/api/knowledge%2Dcontrol",
    "/api/knowledge-control%2Fexample",
    "/api/knowledge-control//example",
  ]) {
    test(`H1 unnormalized ${path} cannot dispatch a reserved named route`, async () => {
      expect(
        (await call(path, "POST", { ...cookie, ...bearer, ...trusted })).status,
      ).toBe(404);
      expect([403, 404]).toContain(
        (await call(path, "POST", { ...cookie, ...bearer })).status,
      );
    });
  }
  test("H1 an empty cookie retains Bearer authentication", async () => {
    expect(
      await call("/API/KNOWLEDGE-CONTROL", "POST", {
        ...bearer,
        cookie: "spartan_session=",
      }),
    ).toEqual({ status: 200, body: { principal: 202 } });
  });
});
