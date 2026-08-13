/**
 * Tests for the /healthz route with a focus on billing-email hydration state.
 *
 * The core concern: there is a short window after startup where
 * `hydrateBillingEmailMetrics()` has not yet completed, so the in-memory
 * failure buffer contains zero entries.  The health route must expose the
 * `billingEmail.hydrated` flag so callers can tell the difference between
 * "no failures on record" and "not yet checked the database".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import express from "express";
import request from "supertest";

// ── mock DB before any module import that touches it ──────────────────────────
vi.mock("../db", () => ({
  db: {
    insert: () => ({ values: () => Promise.resolve() }),
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }),
  },
}));

vi.mock("@workspace/db", () => ({ authEvents: {} }));

import healthRouter from "./health";
import {
  _resetMetrics,
  hydrateBillingEmailMetrics,
  recordBillingEmailFailure,
} from "../billing/billingEmailMetrics";
import { db } from "../db";

function buildApp() {
  const app = express();
  app.use(healthRouter);
  return app;
}

describe("GET /healthz — billing-email hydration", () => {
  beforeEach(() => {
    _resetMetrics();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exposes /health as an alias of /healthz", async () => {
    const app = buildApp();
    const a = await request(app).get("/healthz");
    const b = await request(app).get("/health");
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(b.body).toEqual(a.body);
  });

  it("returns billingEmail.hydrated: false before hydration runs", async () => {
    const app = buildApp();
    const res = await request(app).get("/healthz");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.billingEmail.hydrated).toBe(false);
    // Before hydration, in-memory counts are zero regardless of DB state
    expect(res.body.billingEmail.failures24h).toBe(0);
    expect(res.body.billingEmail.failures1h).toBe(0);
    expect(res.body.billingEmail.ok).toBe(true);
  });

  it("returns billingEmail.hydrated: true and the correct count after hydration", async () => {
    const now = new Date("2026-07-26T12:00:00.000Z");
    vi.setSystemTime(now);

    const mockRows = [
      {
        createdAt: new Date(now.getTime() - 10_000),
        type: "billing_email_failed",
        meta: { emailType: "payment_failed", orgId: 1 },
      },
      {
        createdAt: new Date(now.getTime() - 20_000),
        type: "billing_email_failed",
        meta: { emailType: "canceled", orgId: 2 },
      },
      {
        createdAt: new Date(now.getTime() - 30_000),
        type: "billing_email_failed",
        meta: { emailType: "active", orgId: 3 },
      },
    ];

    vi.spyOn(db, "select").mockReturnValue({
      from: () => ({ where: () => Promise.resolve(mockRows) }),
    } as ReturnType<typeof db.select>);

    // Simulate startup hydration completing
    await hydrateBillingEmailMetrics();

    const app = buildApp();
    const res = await request(app).get("/healthz");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.billingEmail.hydrated).toBe(true);
    // After hydration, the count must reflect the DB rows (not zero)
    expect(res.body.billingEmail.failures24h).toBe(3);
    expect(res.body.billingEmail.failures1h).toBe(3);
    // 3 failures ≥ FAILURE_THRESHOLD_1H (3) → ok is false
    expect(res.body.billingEmail.ok).toBe(false);
  });

  it("returns zero counts but hydrated:true when DB has no recent failures", async () => {
    // DB returns empty → hydration completes but buffer stays empty
    vi.spyOn(db, "select").mockReturnValue({
      from: () => ({ where: () => Promise.resolve([]) }),
    } as ReturnType<typeof db.select>);

    await hydrateBillingEmailMetrics();

    const app = buildApp();
    const res = await request(app).get("/healthz");

    expect(res.status).toBe(200);
    expect(res.body.billingEmail.hydrated).toBe(true);
    expect(res.body.billingEmail.failures24h).toBe(0);
    expect(res.body.billingEmail.ok).toBe(true);
  });

  it("marks hydrated:true even when the DB query fails (documents the failure-safe path)", async () => {
    vi.spyOn(db, "select").mockReturnValue({
      from: () => ({
        where: () => Promise.reject(new Error("DB connection refused")),
      }),
    } as ReturnType<typeof db.select>);

    // hydrateBillingEmailMetrics must not throw; it catches internally
    await expect(hydrateBillingEmailMetrics()).resolves.toBeUndefined();

    const app = buildApp();
    const res = await request(app).get("/healthz");

    expect(res.status).toBe(200);
    // hydrated is true: startup pass ran (and caught the error)
    expect(res.body.billingEmail.hydrated).toBe(true);
    // Buffer is empty because hydration failed — caller sees zero, not false data
    expect(res.body.billingEmail.failures24h).toBe(0);
  });

  it("reflects in-memory failures recorded after hydration", async () => {
    vi.setSystemTime(new Date("2026-07-26T12:00:00.000Z"));

    // Hydration finds nothing in DB
    vi.spyOn(db, "select").mockReturnValue({
      from: () => ({ where: () => Promise.resolve([]) }),
    } as ReturnType<typeof db.select>);
    await hydrateBillingEmailMetrics();

    // A new failure arrives after hydration (e.g., Resend goes down post-deploy)
    recordBillingEmailFailure("payment_failed", 42);

    const app = buildApp();
    const res = await request(app).get("/healthz");

    expect(res.body.billingEmail.hydrated).toBe(true);
    expect(res.body.billingEmail.failures1h).toBe(1);
    expect(res.body.billingEmail.failures24h).toBe(1);
  });
});

describe("GET /healthz/reliability — SLO snapshot", () => {
  it("returns targets, ownership, and live metrics without secrets", async () => {
    const app = buildApp();
    const res = await request(app).get("/healthz/reliability");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok");
    expect(res.body).toHaveProperty("live");
    expect(res.body.live).toHaveProperty("uptimeSec");
    expect(res.body.live).toHaveProperty("memory");
    expect(Array.isArray(res.body.targets)).toBe(true);
    expect(res.body.targets.length).toBeGreaterThan(5);
    expect(res.body.ownership).toHaveProperty("platform_ops");
    expect(res.body.ownership).toHaveProperty("web");
    expect(res.body.ownership).toHaveProperty("ios");
    const blob = JSON.stringify(res.body);
    expect(blob).not.toMatch(/password|Bearer |sk_live|STRIPE_SECRET/i);
  });
});

describe("GET /client-config — delivery contract", () => {
  it("returns flags, contract version, and rollback without secrets", async () => {
    const app = buildApp();
    const res = await request(app)
      .get("/client-config")
      .set("X-Client-Platform", "ios")
      .set("X-Client-Version", "1.0.0");

    expect(res.status).toBe(200);
    expect(res.body.apiContractVersion).toBeGreaterThanOrEqual(1);
    expect(res.body.flags).toBeTypeOf("object");
    expect(res.body.rollback).toHaveProperty("ios");
    expect(res.body.compatibility?.ios?.ok).toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(/sk_live|passwordHash/i);
  });
});

describe("GET /healthz/ops-readiness — DR / incident / support", () => {
  it("returns recovery objectives and support categories without secrets", async () => {
    const app = buildApp();
    const res = await request(app).get("/healthz/ops-readiness");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.recoveryObjectives).toHaveProperty("databaseRpoMinutes");
    expect(Array.isArray(res.body.criticalAssets)).toBe(true);
    expect(Array.isArray(res.body.incidentSeverities)).toBe(true);
    expect(Array.isArray(res.body.supportCategories)).toBe(true);
    expect(res.body.statusTemplates).toHaveProperty("investigating");
    expect(res.body.restoreDrill.command).toMatch(/backup-restore-drill/);
    expect(JSON.stringify(res.body)).not.toMatch(/sk_live|postgres:\/\/|passwordHash/i);
  });
});
