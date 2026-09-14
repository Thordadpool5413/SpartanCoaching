import express, { type RequestHandler } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

type WorkRow = {
  id: string;
  organizationId: number;
  memberId: number;
  accountId: string | null;
  kind: string;
  toolId: string;
  title: string;
  status: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  nextAction: { title: string; href?: string; dueAt?: string } | null;
  sourcePlatform: string;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

type Predicate =
  | { kind: "and"; predicates: Predicate[] }
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "isNull"; column: string };

const state = vi.hoisted(() => ({ rows: [] as WorkRow[], failure: undefined as "select" | "insert" | "update" | undefined }));

vi.mock("drizzle-orm", () => ({
  and: (...predicates: Predicate[]) => ({ kind: "and", predicates }),
  desc: (column: string) => ({ kind: "desc", column }),
  eq: (column: string, value: unknown) => ({ kind: "eq", column, value }),
  isNull: (column: string) => ({ kind: "isNull", column }),
}));

vi.mock("@workspace/db", () => ({
  memberWorkItems: {
    id: "id",
    organizationId: "organizationId",
    memberId: "memberId",
    idempotencyKey: "idempotencyKey",
    archivedAt: "archivedAt",
  },
}));

vi.mock("@workspace/field-kit-catalog", () => ({
  fieldWorkStateForStatus: (status: string) => (
    status === "failed" ? "failed" : status === "completed" ? "completed" : "synced"
  ),
}));

function matches(row: WorkRow, predicate?: Predicate): boolean {
  if (!predicate) return true;
  if (predicate.kind === "and") return predicate.predicates.every((part) => matches(row, part));
  if (predicate.kind === "eq") return row[predicate.column as keyof WorkRow] === predicate.value;
  return row[predicate.column as keyof WorkRow] == null;
}

function matchingRows(predicate?: Predicate): WorkRow[] {
  return state.rows.filter((row) => matches(row, predicate));
}

function createDbMock() {
  return {
    select: () => {
      if (state.failure === "select") throw new Error("database unavailable");
      return {
      from: () => ({
        where: (predicate: Predicate) => {
          const filtered = matchingRows(predicate);
          return {
            limit: async (count: number) => filtered.slice(0, count),
            orderBy: () => ({ limit: async (count: number) => filtered.slice(0, count) }),
          };
        },
      }),
      };
    },
    insert: () => {
      if (state.failure === "insert") throw new Error("database unavailable");
      let values: Omit<WorkRow, "createdAt" | "updatedAt" | "archivedAt">;
      const builder = {
        values(next: Omit<WorkRow, "createdAt" | "updatedAt" | "archivedAt">) {
          values = next;
          return builder;
        },
        onConflictDoNothing() {
          return builder;
        },
        returning: async () => {
          const duplicate = state.rows.find((row) =>
            values.idempotencyKey !== null &&
            row.organizationId === values.organizationId &&
            row.memberId === values.memberId &&
            row.idempotencyKey === values.idempotencyKey
          );
          if (duplicate) return [];
          const now = new Date();
          const row = {
            ...values,
            createdAt: now,
            updatedAt: now,
            archivedAt: null,
          } as WorkRow;
          state.rows.push(row);
          return [row];
        },
      };
      return builder;
    },
    update: () => {
      if (state.failure === "update") throw new Error("database unavailable");
      let changes: Partial<WorkRow> = {};
      return {
        set(next: Partial<WorkRow>) {
          changes = next;
          return {
            where: (predicate: Predicate) => ({
              returning: async () => {
                const row = matchingRows(predicate)[0];
                if (!row) return [];
                Object.assign(row, changes);
                return [row];
              },
            }),
          };
        },
      };
    },
  };
}

vi.mock("../db", () => ({ db: createDbMock() }));

import { registerMemberWorkRoutes } from "./memberWorkRoutes";

const payload = {
  kind: "tool_result",
  toolId: "objection",
  title: "Objection response",
  input: { scenario: "Budget concern" },
  output: { text: "Use a concise value statement." },
  sourcePlatform: "web",
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(((req, _res, next) => {
    const organizationId = Number(req.get("x-organization-id") || 1);
    const memberId = Number(req.get("x-member-id") || 101);
    const authedReq = req as Request & {
      clientMemberId?: number;
      fieldKit?: { member: { id: number; organizationId: number } };
    };
    authedReq.clientMemberId = memberId;
    authedReq.fieldKit = { member: { id: memberId, organizationId } };
    next();
  }) as RequestHandler);
  registerMemberWorkRoutes(app);
  return app;
}

function asOwner(app: ReturnType<typeof buildApp>, organizationId: number, memberId: number) {
  const headers = {
    "x-organization-id": String(organizationId),
    "x-member-id": String(memberId),
  };
  return {
    get: (path: string) => request(app).get(path).set(headers),
    post: (path: string) => request(app).post(path).set(headers),
    patch: (path: string) => request(app).patch(path).set(headers),
  };
}

beforeEach(() => {
  state.rows.length = 0;
  state.failure = undefined;
});

describe("member work saved-work boundaries", () => {
  it("returns the original item for a repeated idempotency key without duplicating it", async () => {
    const app = buildApp();
    const first = await asOwner(app, 1, 101)
      .post("/api/v1/member-work")
      .set("Idempotency-Key", "retry-key-001")
      .send(payload);
    const retry = await asOwner(app, 1, 101)
      .post("/api/v1/member-work")
      .set("Idempotency-Key", "retry-key-001")
      .send({ ...payload, title: "A different retry payload" });

    expect(first.status).toBe(201);
    expect(first.body.idempotent).toBe(false);
    expect(retry.status).toBe(200);
    expect(retry.body.idempotent).toBe(true);
    expect(retry.body.item.id).toBe(first.body.item.id);
    expect(retry.body.item.title).toBe("Objection response");
    expect(state.rows).toHaveLength(1);
  });

  it("does not reuse a key across organizations or members", async () => {
    const app = buildApp();
    const organizationItem = await asOwner(app, 1, 101)
      .post("/api/v1/member-work")
      .set("Idempotency-Key", "owner-scoped-001")
      .send(payload);
    const otherOrganizationItem = await asOwner(app, 2, 101)
      .post("/api/v1/member-work")
      .set("Idempotency-Key", "owner-scoped-001")
      .send(payload);
    const otherMemberItem = await asOwner(app, 1, 202)
      .post("/api/v1/member-work")
      .set("Idempotency-Key", "owner-scoped-001")
      .send(payload);

    expect(organizationItem.status).toBe(201);
    expect(otherOrganizationItem.status).toBe(201);
    expect(otherMemberItem.status).toBe(201);
    expect(new Set([
      organizationItem.body.item.id,
      otherOrganizationItem.body.item.id,
      otherMemberItem.body.item.id,
    ]).size).toBe(3);
    expect(state.rows).toHaveLength(3);
  });

  it("prevents another tenant or member from reading or updating the item", async () => {
    const app = buildApp();
    const created = await asOwner(app, 7, 707)
      .post("/api/v1/member-work")
      .set("Idempotency-Key", "private-item-001")
      .send(payload);
    const id = created.body.item.id;

    const otherOrganizationGet = await asOwner(app, 8, 707).get(`/api/v1/member-work/${id}`);
    const otherOrganizationPatch = await asOwner(app, 8, 707)
      .patch(`/api/v1/member-work/${id}`)
      .send({ status: "failed" });
    const otherMemberGet = await asOwner(app, 7, 808).get(`/api/v1/member-work/${id}`);
    const ownerGet = await asOwner(app, 7, 707).get(`/api/v1/member-work/${id}`);

    expect(otherOrganizationGet.status).toBe(404);
    expect(otherOrganizationGet.body).toEqual({ error: { code: "NOT_FOUND", message: "Saved work was not found." } });
    expect(otherOrganizationPatch.status).toBe(404);
    expect(otherOrganizationPatch.body).toEqual({ error: { code: "NOT_FOUND", message: "Saved work was not found." } });
    expect(otherMemberGet.status).toBe(404);
    expect(ownerGet.status).toBe(200);
    expect(ownerGet.body.item.id).toBe(id);
    expect(ownerGet.body.item.status).toBe("completed");
  });

  it("rejects PHI and invalid idempotency keys with stable error envelopes", async () => {
    const app = buildApp();
    const phi = await asOwner(app, 1, 101)
      .post("/api/v1/member-work")
      .set("Idempotency-Key", "phi-reject-001")
      .send({ ...payload, output: { text: "Patient name: Jane Smith" } });
    const invalidKey = await asOwner(app, 1, 101)
      .post("/api/v1/member-work")
      .set("Idempotency-Key", "short")
      .send(payload);

    expect(phi.status).toBe(400);
    expect(phi.body).toEqual({
      error: {
        code: "POTENTIAL_PHI_DETECTED",
        message: "Remove patient identifiers before saving work.",
      },
    });
    expect(invalidKey.status).toBe(400);
    expect(invalidKey.body).toEqual({
      error: {
        code: "INVALID_IDEMPOTENCY_KEY",
        message: "Idempotency-Key must contain 8 to 200 printable characters.",
      },
    });
    expect(state.rows).toHaveLength(0);
  });

  it("uses the same structured envelope for list, save, and update server failures", async () => {
    const app = buildApp();

    state.failure = "select";
    const listFailure = await asOwner(app, 1, 101).get("/api/v1/member-work");
    expect(listFailure.status).toBe(500);
    expect(listFailure.body).toEqual({
      error: { code: "LIST_FAILED", message: "Saved work could not be loaded." },
    });

    state.failure = "insert";
    const saveFailure = await asOwner(app, 1, 101)
      .post("/api/v1/member-work")
      .set("Idempotency-Key", "server-failure-001")
      .send(payload);
    expect(saveFailure.status).toBe(500);
    expect(saveFailure.body).toEqual({
      error: { code: "SAVE_FAILED", message: "The result could not be saved." },
    });

    state.failure = undefined;
    const created = await asOwner(app, 1, 101)
      .post("/api/v1/member-work")
      .set("Idempotency-Key", "server-update-001")
      .send(payload);
    state.failure = "update";
    const updateFailure = await asOwner(app, 1, 101)
      .patch(`/api/v1/member-work/${created.body.item.id}`)
      .send({ status: "failed" });
    expect(updateFailure.status).toBe(500);
    expect(updateFailure.body).toEqual({
      error: { code: "UPDATE_FAILED", message: "Saved work could not be updated." },
    });
  });

  it("allows a failed item to recover through an owner-scoped progress update", async () => {
    const app = buildApp();
    const failed = await asOwner(app, 3, 303)
      .post("/api/v1/member-work")
      .set("Idempotency-Key", "failed-recovery-001")
      .send({ ...payload, status: "failed" });
    const recovered = await asOwner(app, 3, 303)
      .patch(`/api/v1/member-work/${failed.body.item.id}`)
      .send({ status: "completed", nextAction: { title: "Review the completed brief" } });

    expect(failed.status).toBe(201);
    expect(failed.body.item.status).toBe("failed");
    expect(failed.body.item.syncState).toBe("failed");
    expect(recovered.status).toBe(200);
    expect(recovered.body.item.status).toBe("completed");
    expect(recovered.body.item.syncState).toBe("completed");
    expect(recovered.body.item.nextAction).toEqual({ title: "Review the completed brief" });
  });
});