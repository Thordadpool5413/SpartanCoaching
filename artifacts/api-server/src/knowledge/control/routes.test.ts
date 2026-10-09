import { it, expect, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import type { Pool } from "pg";
import {
  knowledgeRouter,
  sanitizedKnowledgePath,
  knowledgeErrorHandler,
} from "./routes";
import { KnowledgeUnavailable } from "../persistence/deadline";
import {
  executeKnowledgeCommand,
  getExecuteKnowledgeCommandMutationOptions,
} from "../../../../../lib/api-client-react/src/generated/api";
import { requireTrustedMutationOrigin } from "../../security/requestSecurity";
import { strictJson, wireCommandSchema } from "./contracts";
import {
  recordKnowledgeMetric,
  knowledgeMetricsSnapshot,
} from "../../observability/knowledgeMetrics";
const make = (enabled: boolean) => {
  const app = express();
  app.use(cookieParser());
  app.use(requireTrustedMutationOrigin);
  app.use("/api/knowledge-control", knowledgeRouter({} as Pool, { enabled }));
  return app;
};
it("disabled control plane and unknown namespace cannot fall through", async () => {
  expect(
    (await request(make(false)).get("/api/knowledge-control/tenant/scope"))
      .status,
  ).toBe(404);
  expect(
    (
      await request(make(true)).get(
        "/api/knowledge-control/tenant/unknown/synthetic",
      )
    ).status,
  ).toBe(404);
});
it("cookie-first Origin guard wins over bearer; native auth preserves unauthenticated response", async () => {
  expect(
    (
      await request(make(true))
        .post("/API/KNOWLEDGE-CONTROL/tenant/commands")
        .set("Cookie", "spartan_session=synthetic-cookie")
        .set("Authorization", "Bearer synthetic-token")
        .send({})
    ).status,
  ).toBe(403);
  expect(
    (await request(make(true)).get("/api/knowledge-control/tenant/scope"))
      .status,
  ).toBe(401);
});
it("rejects duplicate escaped keys, excessive depth, forms, oversized JSON and client authority", async () => {
  expect(() =>
    strictJson('{"operation":"REVOKE","\\u006fperation":"ACTIVATE"}'),
  ).toThrow("KNOWLEDGE_CONTRACT_INVALID");
  expect(() => strictJson("[".repeat(66) + "0" + "]".repeat(66))).toThrow(
    "KNOWLEDGE_CONTRACT_INVALID",
  );
  expect(strictJson('{"a":[true,null,1]}')).toEqual({ a: [true, null, 1] });
  const command = {
    operation: "REVOKE",
    versionId: "synthetic-version",
    expectedScopeRevision: 1,
    expectedVersionRevisions: { "synthetic-version": 1 },
  };
  for (const field of [
    "actor",
    "organizationId",
    "tenant",
    "role",
    "grant",
    "qualification",
    "administrator",
  ])
    expect(
      wireCommandSchema.safeParse({ ...command, [field]: "synthetic" }).success,
    ).toBe(false);
  expect(
    (
      await request(make(true))
        .post("/api/knowledge-control/tenant/commands")
        .type("form")
        .send(command)
    ).status,
  ).toBe(400);
  expect(
    (
      await request(make(true))
        .post("/api/knowledge-control/tenant/commands")
        .type("json")
        .send(JSON.stringify({ synthetic: "x".repeat(1048576) }))
    ).status,
  ).toBe(413);
});
it("redacts every case variant and arbitrary reserved path label and sets no-store", async () => {
  expect(
    sanitizedKnowledgePath("/API/Knowledge-Control/tenant/PHI_SENTINEL"),
  ).toBe("/api/knowledge-control/:scopeKind/:surface");
  const response = await request(make(true)).get(
    "/api/knowledge-control/tenant/scope",
  );
  expect(response.headers["cache-control"]).toContain("no-store");
  expect(JSON.stringify(response.body)).not.toContain("synthetic-password");
});
it("telemetry retains only fixed metric names and bounded numeric samples", () => {
  for (let i = 0; i < 1000; i++) recordKnowledgeMetric("command_ms", i);
  recordKnowledgeMetric("PHI_SENTINEL" as "command_ms", 1);
  const snapshot = knowledgeMetricsSnapshot();
  expect(snapshot.command_ms.sampleCount).toBe(500);
  expect(JSON.stringify(snapshot)).not.toContain("PHI_SENTINEL");
});
const failureResponse = (error: unknown) => {
  const app = express();
  app.post("/command", (_req, _res, next) => next(error));
  app.use(knowledgeErrorHandler);
  return request(app).post("/command");
};
it.each([
  ["COMMAND_IN_PROGRESS", 409],
  ["COMMAND_UNAVAILABLE", 503],
  ["COMMAND_OUTCOME_UNKNOWN", 503],
] as const)(
  "%s includes retry timing and preserves uncertain-outcome replay instructions",
  async (code, status) => {
    const response = await failureResponse(new KnowledgeUnavailable(code));
    expect(response.status).toBe(status);
    expect(response.headers["retry-after"]).toBe("1");
    expect(response.body).toEqual({
      code,
      ...(code === "COMMAND_OUTCOME_UNKNOWN"
        ? { retry: "SAME_KEY_AND_PAYLOAD" }
        : {}),
    });
  },
);
it.each([
  "ACTIVATION_RIGHTS_OR_INTERVAL_REQUIRED",
  "KNOWLEDGE_LKG_INVALID",
  "KNOWLEDGE_ACTIVATION_INVALID",
  "KNOWLEDGE_REPLACEMENT_INVALID",
  "KNOWLEDGE_SUBMISSION_INVALID",
  "KNOWLEDGE_DUTY_CONFLICT",
  "KNOWLEDGE_REVIEW_TRANSITION_INVALID",
  "KNOWLEDGE_REVIEW_WINDOW_INVALID",
])("%s returns an actionable bounded lifecycle conflict", async (code) => {
  const response = await failureResponse(new Error(code));
  expect(response.status).toBe(409);
  expect(response.body).toEqual({ code });
  expect(response.headers["retry-after"]).toBeUndefined();
});
it("unexpected failures remain bounded and never echo storage or request details", async () => {
  const response = await failureResponse(
    new Error("PHI_SENTINEL raw-idempotency-key synthetic-token"),
  );
  expect(response.status).toBe(500);
  expect(response.body).toEqual({ code: "KNOWLEDGE_INTERNAL_ERROR" });
});
it("generated command calls and mutation variables send their own required idempotency key", async () => {
  const fetchMock = vi.fn(async () =>
    Response.json({
      scopeRevision: 2,
      versionIds: ["synthetic-version"],
      assignmentIds: [],
      eventIds: [],
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const data = {
    operation: "REVOKE" as const,
    versionId: "synthetic-version",
    expectedScopeRevision: 1,
    expectedVersionRevisions: { "synthetic-version": 1 },
  };
  try {
    await executeKnowledgeCommand("tenant", data, {
      "Idempotency-Key": "synthetic-direct-key",
    });
    const mutation = getExecuteKnowledgeCommandMutationOptions().mutationFn!;
    await mutation(
      {
        scopeKind: "tenant",
        data,
        headers: { "Idempotency-Key": "synthetic-mutation-one" },
      },
      {} as never,
    );
    await mutation(
      {
        scopeKind: "tenant",
        data: { ...data, expectedScopeRevision: 2 },
        headers: { "Idempotency-Key": "synthetic-mutation-two" },
      },
      {} as never,
    );
    expect(
      fetchMock.mock.calls.map((call) =>
        new Headers((call as unknown as [string, RequestInit])[1].headers).get(
          "Idempotency-Key",
        ),
      ),
    ).toEqual([
      "synthetic-direct-key",
      "synthetic-mutation-one",
      "synthetic-mutation-two",
    ]);
    expect(
      fetchMock.mock.calls.map(
        (call) => (call as unknown as [string, RequestInit])[0],
      ),
    ).toEqual(Array(3).fill("/api/knowledge-control/tenant/commands"));
    expect(
      JSON.parse(
        (fetchMock.mock.calls[2] as unknown as [string, RequestInit])[1]
          .body as string,
      ).expectedScopeRevision,
    ).toBe(2);
  } finally {
    vi.unstubAllGlobals();
  }
});
