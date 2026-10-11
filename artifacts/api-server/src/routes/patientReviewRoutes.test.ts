import express from "express";
import request from "supertest";
import { getTableColumns, getTableName } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerAiToolRoutes } from "./aiToolRoutes";
import { registerPatientReviewRoutes } from "./patientReviewRoutes";
import { runSpartanAiTool } from "@workspace/spartan-ai-tools/server";
import {
  deleteEphemeralClinicalObject,
  saveEphemeralClinicalObject,
  scanEphemeralClinicalObject,
} from "../clinical/storage";
import { runEphemeralClinicalSweep } from "../clinical/ephemeral";
import { syntheticPhiEnvironment } from "../../../../lib/spartan-ai-tools/src/clinical-runtime.test-fixtures";

type Row = Record<string, any>;
type Predicate =
  | { kind: "and" | "or"; parts: Predicate[] }
  | { kind: "eq" | "gt" | "lte"; column: any; value: any };
const state = vi.hoisted(() => ({
  rows: {} as Record<string, Row[]>,
  writes: [] as Row[],
  context: {} as Row,
}));
vi.mock("drizzle-orm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("drizzle-orm")>()),
  and: (...parts: Predicate[]) => ({ kind: "and", parts }),
  or: (...parts: Predicate[]) => ({ kind: "or", parts }),
  eq: (column: any, value: any) => ({ kind: "eq", column, value }),
  gt: (column: any, value: any) => ({ kind: "gt", column, value }),
  lte: (column: any, value: any) => ({ kind: "lte", column, value }),
}));
vi.mock("../db", () => ({ db: fakeDb() }));
vi.mock("../resend", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../resend")>()),
  sendClinicalMfaCode: vi.fn(async () => true),
}));
vi.mock("../clinical/coverageBootstrap", () => ({
  loadLatestCoverageSnapshot: vi.fn(
    async () => state.rows.coverage_snapshots[0],
  ),
  isEducationalBaselineSnapshot: () => false,
}));
vi.mock("../rateLimits", () => {
  const pass = (_req: unknown, _res: unknown, next: () => void) => next();
  return { heavyAiLimit: pass, standardAiLimit: pass, globalDailyAiCap: pass };
});
vi.mock("../clinical/storage", () => ({
  assertEphemeralBucketConfiguration: vi.fn(async () => undefined),
  createEphemeralClinicalObjectKey: vi.fn(
    () => "organizations/42/clinical-ephemeral/synthetic/opaque",
  ),
  deleteEphemeralClinicalObject: vi.fn(async () => undefined),
  downloadEphemeralClinicalObject: vi.fn(async () =>
    Buffer.from("SYNTHETIC_RECORD_SENTINEL"),
  ),
  saveEphemeralClinicalObject: vi.fn(async () => undefined),
  scanEphemeralClinicalObject: vi.fn(async () => "safe"),
  validateClinicalUpload: vi.fn(),
}));
vi.mock("../clinical/patientExtraction", () => ({
  assertClinicalFileSignature: vi.fn(),
  extractPatientDocument: vi.fn(async () => "SYNTHETIC_RECORD_SENTINEL"),
}));
vi.mock("@workspace/spartan-ai-tools/server", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@workspace/spartan-ai-tools/server")
  >()),
  runSpartanAiTool: vi.fn(async () => ({
    output: { summary: "Synthetic draft; clinician review required" },
  })),
}));

function field(table: any, column: any) {
  return Object.entries(getTableColumns(table)).find(
    ([, value]) => value === column,
  )![0];
}
function matches(table: any, row: Row, p: Predicate): boolean {
  if ("parts" in p)
    return p.kind === "and"
      ? p.parts.every((part) => matches(table, row, part))
      : p.parts.some((part) => matches(table, row, part));
  const value = row[field(table, p.column)];
  return p.kind === "eq"
    ? value === p.value
    : p.kind === "gt"
      ? value > p.value
      : value <= p.value;
}
function rows(table: any) {
  return (state.rows[getTableName(table)] ??= []);
}
function fakeDb(): any {
  const db = {
    select: (selection?: Row) => ({
      from: (table: any) => {
        const query = (predicate?: Predicate) => {
          const result = rows(table)
            .filter((row) => !predicate || matches(table, row, predicate))
            .map((row) =>
              selection
                ? Object.fromEntries(
                    Object.entries(selection).map(([alias, column]) => [
                      alias,
                      row[field(table, column)],
                    ]),
                  )
                : row,
            );
          return {
            limit: async (count: number) => result.slice(0, count),
            for: async () => result,
            then: (resolve: any, reject: any) =>
              Promise.resolve(result).then(resolve, reject),
          };
        };
        return { where: query, orderBy: () => query() };
      },
    }),
    insert: (table: any) => ({
      values: (values: Row) => {
        state.writes.push({ table: getTableName(table), ...values });
        const row = { id: SESSION, status: "open", ...values };
        rows(table).push(row);
        const builder = {
          onConflictDoUpdate: () => builder,
          returning: async () => [row],
          then: (resolve: any, reject: any) =>
            Promise.resolve().then(resolve, reject),
        };
        return builder;
      },
    }),
    update: (table: any) => ({
      set: (values: Row) => ({
        where: async (predicate: Predicate) => {
          for (const row of rows(table).filter((row) =>
            matches(table, row, predicate),
          ))
            Object.assign(row, values);
          state.writes.push({ table: getTableName(table), ...values });
        },
      }),
    }),
    delete: (table: any) => ({
      where: async (predicate: Predicate) => {
        state.rows[getTableName(table)] = rows(table).filter(
          (row) => !matches(table, row, predicate),
        );
        // The actual SQL FK cascades ephemeral object metadata when the session is deleted.
        if (getTableName(table) === "clinical_ephemeral_sessions")
          state.rows.clinical_ephemeral_objects = [];
      },
    }),
    transaction: async (action: (tx: any) => Promise<any>) => {
      const before = structuredClone(state.rows);
      try {
        return await action(db);
      } catch (error) {
        state.rows = before;
        throw error;
      }
    },
  };
  return db;
}
const SESSION = "11111111-1111-4111-8111-111111111111";
const POLICY = "22222222-2222-4222-8222-222222222222";
const PATH = "/api/clinical/patient-review/sessions";
function app(includeAiRoutes = false) {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => {
    Object.assign(req, state.context);
    next();
  });
  registerPatientReviewRoutes(a);
  if (includeAiRoutes) registerAiToolRoutes(a);
  return a;
}
function permit(values: Row = {}) {
  state.rows.clinical_permissions = [
    {
      organizationId: 42,
      memberId: 7,
      canUse: true,
      canReview: true,
      canAdmin: false,
      revokedAt: null,
      ...values,
    },
  ];
}
function seedReview() {
  state.rows.clinical_ephemeral_sessions = [
    {
      id: SESSION,
      organizationId: 42,
      createdByMemberId: 7,
      coverageSnapshotId: POLICY,
      status: "open",
      expiresAt: new Date(Date.now() + 60_000),
    },
  ];
  state.rows.clinical_ephemeral_objects = [
    {
      id: "opaque-document",
      sessionId: SESSION,
      organizationId: 42,
      objectKey: "opaque-object",
      contentType: "text/plain",
      scanStatus: "safe",
    },
  ];
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(deleteEphemeralClinicalObject).mockResolvedValue(undefined);
  vi.mocked(scanEphemeralClinicalObject).mockResolvedValue("safe");
  vi.mocked(runSpartanAiTool).mockResolvedValue({
    output: { summary: "Synthetic draft; clinician review required" },
  } as never);
  for (const [name, value] of Object.entries(syntheticPhiEnvironment))
    vi.stubEnv(name, value);
  state.writes = [];
  state.context = {
    clientMemberId: 7,
    sessionId: 70,
    fieldKit: {
      allowed: true,
      member: { id: 7, organizationId: 42, status: "active", role: "member" },
      org: {
        id: 42,
        type: "personal",
        status: "active",
        billingPlan: "individual_weekly_elite",
      },
    },
  };
  state.rows = {
    client_sessions: [
      {
        id: 70,
        memberId: 7,
        expiresAt: new Date(Date.now() + 60_000),
        mfaVerifiedAt: new Date(),
      },
    ],
    coverage_snapshots: [
      {
        id: POLICY,
        source: "CMS_MCD",
        retiredAt: null,
        effectiveAt: new Date(Date.now() - 60_000),
        documentId: "synthetic-policy",
        version: "1",
        payload: {},
        contentHash: "public-policy-hash",
        sourceUrl: "https://example.invalid/policy",
      },
    ],
  };
  permit();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("patient review authority, readiness and MFA", () => {
  it.each(["platform_admin", "org_admin", "member"])(
    "denies %s without explicit tenant canReview",
    async (role) => {
      permit({ canReview: false, canAdmin: role === "org_admin" });
      state.context.fieldKit.member.role = role;
      const res = await request(app())
        .post(PATH)
        .send({ coverageSnapshotId: POLICY });
      expect(res.status).toBe(403);
      expect(res.headers["cache-control"]).toContain("no-store");
      expect(state.writes).toEqual([]);
    },
  );
  it.each([
    { canAdmin: true, canReview: false },
    { revokedAt: new Date() },
    { organizationId: 99 },
    { memberId: 99 },
  ])("denies non-review/revoked/foreign authority %j", async (values) => {
    permit(values);
    expect(
      (await request(app()).post(PATH).send({ coverageSnapshotId: POLICY }))
        .status,
    ).toBe(403);
    expect(state.writes).toEqual([]);
  });
  it.each(["disabled", "invited", "unknown"])(
    "denies inactive membership %s",
    async (status) => {
      state.context.fieldKit.member.status = status;
      expect(
        (await request(app()).post(PATH).send({ coverageSnapshotId: POLICY }))
          .status,
      ).toBe(403);
    },
  );
  it("denies missing feature entitlement despite a review grant", async () => {
    state.context.fieldKit.org.billingPlan = "individual_weekly";
    expect(
      (await request(app()).post(PATH).send({ coverageSnapshotId: POLICY }))
        .status,
    ).toBe(403);
  });
  it.each([
    null,
    new Date(Date.now() - 16 * 60_000),
    new Date(Date.now() + 60_000),
    new Date(NaN),
  ])("denies missing, expired, future or invalid MFA %s", async (value) => {
    state.rows.client_sessions[0].mfaVerifiedAt = value;
    const res = await request(app())
      .post(PATH)
      .send({ coverageSnapshotId: POLICY });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("CLINICAL_MFA_REQUIRED");
    expect(state.writes).toEqual([]);
  });
  it.each(["absent", "wrong_member", "expired_session"])(
    "denies session %s",
    async (variant) => {
      if (variant === "absent") state.context.sessionId = undefined;
      if (variant === "wrong_member")
        state.rows.client_sessions[0].memberId = 99;
      if (variant === "expired_session")
        state.rows.client_sessions[0].expiresAt = new Date(0);
      expect(
        (await request(app()).post(PATH).send({ coverageSnapshotId: POLICY }))
          .status,
      ).toBe(403);
    },
  );
  it.each(Object.keys(syntheticPhiEnvironment))(
    "never accepts a patient request when %s is missing",
    async (name) => {
      vi.stubEnv(name, undefined);
      const res = await request(app())
        .post(PATH)
        .send({ coverageSnapshotId: POLICY });
      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe("PATIENT_REVIEW_UNAVAILABLE");
      expect(state.writes).toEqual([]);
    },
  );
  it.each(["personal", "company"])(
    "allows explicit review with active %s membership, Elite feature and recent MFA",
    async (type) => {
      state.context.fieldKit.org.type = type;
      state.context.fieldKit.org.billingPlan =
        type === "company"
          ? "corporate_contract_elite"
          : "individual_weekly_elite";
      permit({ canUse: false }); // Review permission is independent of ordinary tool use.
      const res = await request(app())
        .post(PATH)
        .send({ coverageSnapshotId: POLICY });
      expect(res.status).toBe(201);
      expect(res.headers["cache-control"]).toContain("no-store");
      expect(res.body.sessionId).toBe(SESSION);
    },
  );
});

describe("temporary review and human decision support", () => {
  it("requires human review confirmation before model execution", async () => {
    seedReview();
    const res = await request(app())
      .post(`${PATH}/${SESSION}/finalize`)
      .send({ confirmedHumanReview: false });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("REVIEW_CONFIRMATION_REQUIRED");
    expect(runSpartanAiTool).not.toHaveBeenCalled();
  });
  it("rejects a foreign session without downloading or analysing it", async () => {
    seedReview();
    state.rows.clinical_ephemeral_sessions[0].organizationId = 99;
    const res = await request(app())
      .post(`${PATH}/${SESSION}/finalize`)
      .send({ confirmedHumanReview: true });
    expect(res.status).toBe(410);
    expect(runSpartanAiTool).not.toHaveBeenCalled();
  });
  it("purges before returning the one-time draft and retains only content-free metadata", async () => {
    seedReview();
    const res = await request(app()).post(`${PATH}/${SESSION}/finalize`).send({
      confirmedHumanReview: true,
      filename: "SYNTHETIC_FILENAME_SENTINEL.pdf",
    });
    expect(res.status).toBe(200);
    expect(deleteEphemeralClinicalObject).toHaveBeenCalledWith("opaque-object");
    expect(state.rows.clinical_ephemeral_sessions).toEqual([]);
    expect(state.rows.clinical_ephemeral_objects).toEqual([]);
    expect(res.body.result.retention).toBe("one-time");
    expect(res.body.result.watermark).toContain(
      "No autonomous eligibility, coding or prescribing decision",
    );
    expect(JSON.stringify(state.writes)).not.toMatch(
      /SYNTHETIC_RECORD_SENTINEL|SYNTHETIC_FILENAME_SENTINEL|Synthetic draft|recordText|diagnoses|output/,
    );
    expect(state.rows.clinical_audit_events.at(-1).metadata).toMatchObject({
      deletionVerified: true,
      retainedClinicalContent: false,
    });
  });
  it("purges on cancellation without running a model", async () => {
    seedReview();
    expect((await request(app()).delete(`${PATH}/${SESSION}`)).status).toBe(
      204,
    );
    expect(deleteEphemeralClinicalObject).toHaveBeenCalledWith("opaque-object");
    expect(state.rows.clinical_ephemeral_sessions).toEqual([]);
    expect(runSpartanAiTool).not.toHaveBeenCalled();
  });
  it("purges and sanitizes an unknown model failure", async () => {
    seedReview();
    vi.mocked(runSpartanAiTool).mockRejectedValue(
      new Error("SYNTHETIC_FAILURE_SENTINEL"),
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await request(app())
      .post(`${PATH}/${SESSION}/finalize`)
      .send({ confirmedHumanReview: true });
    expect(res.status).toBe(500);
    expect(deleteEphemeralClinicalObject).toHaveBeenCalledWith("opaque-object");
    expect(state.rows.clinical_ephemeral_sessions).toEqual([]);
    expect(
      JSON.stringify([res.body, log.mock.calls, state.writes]),
    ).not.toContain("SYNTHETIC_FAILURE_SENTINEL");
  });
  it("discards the draft and retains retryable metadata if verified purge fails", async () => {
    seedReview();
    vi.mocked(deleteEphemeralClinicalObject).mockRejectedValue(
      new Error("SYNTHETIC_DELETE_FAILURE_SENTINEL"),
    );
    const res = await request(app())
      .post(`${PATH}/${SESSION}/finalize`)
      .send({ confirmedHumanReview: true });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("CLEANUP_PENDING");
    expect(res.body.result).toBeUndefined();
    expect(state.rows.clinical_ephemeral_sessions).toHaveLength(1);
    expect(state.rows.clinical_ephemeral_objects).toHaveLength(1);
    expect(JSON.stringify(res.body)).not.toContain(
      "SYNTHETIC_DELETE_FAILURE_SENTINEL",
    );
  });
  it("keeps cleanup retry metadata when a rejected upload cannot be purged", async () => {
    seedReview();
    state.rows.clinical_ephemeral_objects = [];
    vi.mocked(scanEphemeralClinicalObject).mockResolvedValue("rejected");
    vi.mocked(deleteEphemeralClinicalObject).mockRejectedValue(
      new Error("SYNTHETIC_SCAN_DELETE_SENTINEL"),
    );
    const res = await request(app())
      .post(`${PATH}/${SESSION}/documents`)
      .set("Content-Type", "text/plain")
      .send("SYNTHETIC_UPLOAD_SENTINEL");
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("CLEANUP_PENDING");
    expect(saveEphemeralClinicalObject).toHaveBeenCalled();
    expect(state.rows.clinical_ephemeral_objects[0].scanStatus).not.toBe(
      "safe",
    );
    expect(JSON.stringify(state.writes)).not.toContain(
      "SYNTHETIC_UPLOAD_SENTINEL",
    );
  });
  it("does not log raw storage/SDK failures during cleanup retries", async () => {
    seedReview();
    state.rows.clinical_ephemeral_sessions[0].expiresAt = new Date(0);
    vi.mocked(deleteEphemeralClinicalObject).mockRejectedValue(
      new Error("SYNTHETIC_SDK_CONTENT_SENTINEL"),
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await runEphemeralClinicalSweep()).toMatchObject({
      purged: 0,
      failed: 1,
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "SYNTHETIC_SDK_CONTENT_SENTINEL",
    );
    expect(log).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ code: "EPHEMERAL_PURGE_FAILED" }),
    );
    expect(state.rows.clinical_ephemeral_sessions[0].status).toBe("purging");
  });
});

describe("clinical permission administration boundary", () => {
  it.each([
    "missing",
    "expired",
    "future",
    "invalid",
    "absent_session",
    "foreign_session",
    "expired_session",
  ])(
    "denies permission changes without actor-bound recent MFA: %s",
    async (variant) => {
      permit({ canAdmin: true, canReview: false });
      state.rows.client_members = [{ id: 8, organizationId: 42 }];
      if (variant === "missing")
        state.rows.client_sessions[0].mfaVerifiedAt = null;
      if (variant === "expired")
        state.rows.client_sessions[0].mfaVerifiedAt = new Date(
          Date.now() - 16 * 60_000,
        );
      if (variant === "future")
        state.rows.client_sessions[0].mfaVerifiedAt = new Date(
          Date.now() + 60_000,
        );
      if (variant === "invalid")
        state.rows.client_sessions[0].mfaVerifiedAt = new Date(NaN);
      if (variant === "absent_session") state.context.sessionId = undefined;
      if (variant === "foreign_session")
        state.rows.client_sessions[0].memberId = 99;
      if (variant === "expired_session")
        state.rows.client_sessions[0].expiresAt = new Date(0);
      const res = await request(app(true))
        .put("/api/clinical/permissions/8")
        .send({ canReview: true });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("CLINICAL_MFA_REQUIRED");
      expect(state.writes).toEqual([]);
    },
  );
  it("rejects a clinical administrator adding their own review authority", async () => {
    permit({ canAdmin: true, canReview: false });
    state.rows.client_members = [{ id: 7, organizationId: 42 }];
    const res = await request(app(true))
      .put("/api/clinical/permissions/7")
      .send({ canUse: true, canAdmin: true, canReview: true });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("CLINICAL_SELF_GRANT_DENIED");
    expect(state.writes).toEqual([]);
    expect(
      (await request(app()).post(PATH).send({ coverageSnapshotId: POLICY }))
        .status,
    ).toBe(403);
  });
  it("permits self-reduction by an already authorized clinical reviewer/admin", async () => {
    permit({ canAdmin: true, canReview: true });
    state.rows.client_members = [{ id: 7, organizationId: 42 }];
    expect(
      (
        await request(app(true))
          .put("/api/clinical/permissions/7")
          .send({ canAdmin: true, canReview: false })
      ).status,
    ).toBe(200);
    expect(state.writes[0]).toMatchObject({ memberId: 7, canReview: false });
  });
  it.each(["platform_admin", "org_admin"])(
    "denies %s granting clinical authority without an explicit clinical-admin grant",
    async (role) => {
      state.context.fieldKit.member.role = role;
      state.context.fieldKit.org.type = "company";
      state.context.fieldKit.org.billingPlan = "corporate_contract_elite";
      permit({ canAdmin: false, canReview: false });
      state.rows.client_members = [{ id: 7, organizationId: 42 }];
      const res = await request(app(true))
        .put("/api/clinical/permissions/7")
        .send({ canReview: true, canAdmin: true });
      expect(res.status).toBe(403);
      expect(state.writes).toEqual([]);
    },
  );
  it("allows explicit clinical-admin permission management without patient-review authority", async () => {
    state.context.fieldKit.org.type = "company";
    state.context.fieldKit.org.billingPlan = "corporate_contract_elite";
    permit({ canUse: false, canAdmin: true, canReview: false });
    state.rows.client_members = [{ id: 8, organizationId: 42 }];
    expect(
      (
        await request(app(true))
          .put("/api/clinical/permissions/8")
          .send({ canReview: true })
      ).status,
    ).toBe(200);
    expect(
      (await request(app()).post(PATH).send({ coverageSnapshotId: POLICY }))
        .status,
    ).toBe(403);
  });
  it("denies revoked clinical administration and foreign target members", async () => {
    permit({ canAdmin: true, revokedAt: new Date() });
    expect(
      (
        await request(app(true))
          .put("/api/clinical/permissions/8")
          .send({ canReview: true })
      ).status,
    ).toBe(403);
    permit({ canAdmin: true });
    state.rows.client_members = [{ id: 8, organizationId: 99 }];
    expect(
      (
        await request(app(true))
          .put("/api/clinical/permissions/8")
          .send({ canReview: true })
      ).status,
    ).toBe(404);
    expect(state.writes).toEqual([]);
  });
});

describe("clinical review and administration prerequisites", () => {
  function company(values: Row) {
    state.context.fieldKit.org.type = "company";
    state.context.fieldKit.org.billingPlan = "corporate_contract_elite";
    permit({ canUse: false, canReview: false, canAdmin: false, ...values });
  }
  it("allows a review-only company member to obtain the existing public coverage prerequisite", async () => {
    company({ canReview: true });
    const res = await request(app(true)).get(
      "/api/clinical/coverage/snapshots",
    );
    expect(res.status).toBe(200);
    expect(res.body.snapshots[0].id).toBe(POLICY);
  });
  it.each(["canReview", "canAdmin"])(
    "allows an explicit %s-only company member to request the existing MFA challenge",
    async (capability) => {
      company({ [capability]: true });
      state.rows.client_sessions[0].mfaVerifiedAt = null;
      const res = await request(app(true)).post("/api/clinical/mfa/request");
      expect(res.status).toBe(201);
      expect(state.rows.clinical_mfa_challenges[0]).toMatchObject({
        organizationId: 42,
        memberId: 7,
      });
      expect(
        (await request(app()).post(PATH).send({ coverageSnapshotId: POLICY }))
          .status,
      ).toBe(403);
    },
  );
  it.each(["absent", "revoked"])(
    "denies company prerequisites with %s clinical authority",
    async (variant) => {
      company(
        variant === "revoked"
          ? { canReview: true, canAdmin: true, revokedAt: new Date() }
          : {},
      );
      expect(
        (await request(app(true)).get("/api/clinical/coverage/snapshots"))
          .status,
      ).toBe(403);
      expect(
        (await request(app(true)).post("/api/clinical/mfa/request")).status,
      ).toBe(403);
      expect(state.writes).toEqual([]);
    },
  );
  it("preserves clinical administration step-up in deidentified configuration", async () => {
    company({ canAdmin: true });
    vi.stubEnv("CLINICAL_OPERATION_MODE", "deidentified");
    state.rows.client_members = [{ id: 8, organizationId: 42 }];
    state.rows.client_sessions[0].mfaVerifiedAt = null;
    expect(
      (await request(app(true)).post("/api/clinical/mfa/request")).status,
    ).toBe(201);
    expect(
      (
        await request(app(true))
          .put("/api/clinical/permissions/8")
          .send({ canReview: true })
      ).status,
    ).toBe(403);
    state.rows.client_sessions[0].mfaVerifiedAt = new Date();
    expect(
      (
        await request(app(true))
          .put("/api/clinical/permissions/8")
          .send({ canReview: true })
      ).status,
    ).toBe(200);
  });
});
