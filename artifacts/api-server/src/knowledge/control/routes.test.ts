import { it, expect } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import type { Pool } from "pg";
import { knowledgeRouter, sanitizedKnowledgePath } from "./routes";
import { requireTrustedMutationOrigin } from "../../security/requestSecurity";
import { strictJson, wireCommandSchema } from "./contracts";
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
