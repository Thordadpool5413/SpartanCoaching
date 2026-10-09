import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import request from "supertest";
import app from "../app";
import { API_CONTRACT_VERSION } from "@workspace/field-kit-catalog";
import {
  GetMemberSyncResponse,
  PostMemberSyncResponse,
  ListMemberWorkResponse,
  CreateMemberWorkResponse,
} from "@workspace/api-zod";

const root = join(import.meta.dirname, "../../../../");
const spec = readFileSync(join(root, "lib/api-spec/openapi.yaml"), "utf8");
type Layer = {
  route?: { path?: string; methods?: Record<string, boolean> };
  path?: string;
  regexp?: { source?: string };
  handle?: { stack?: Layer[] };
};

function registeredOperations(): Set<string> {
  const operations = new Set<string>();
  for (const operation of ((app as ExpressWithRouter).get("apiRouteManifest") as string[] | undefined) ?? []) {
    operations.add(operation);
  }
  function walk(stack: Layer[] | undefined, prefix = "") {
    for (const layer of stack ?? []) {
      if (layer.route?.path && layer.route.methods) {
        for (const method of Object.keys(layer.route.methods)) {
          operations.add(`${method.toUpperCase()} ${prefix}${layer.route.path}`);
          // Routers mounted through Express 5's app.use can expose an
          // empty layer.path while retaining the child routes. The API app
          // mounts its child router at /api; retain that mount in the
          // assembled registry as well.
          if (!prefix && typeof layer.route.path === "string" && layer.route.path.startsWith("/")) {
            operations.add(`${method.toUpperCase()} /api${layer.route.path}`);
          }
        }
      } else if (layer.handle?.stack) {
        // Express 5 stores mount prefixes in the layer regexp rather than
        // consistently exposing layer.path.
        const source = layer.regexp?.source || "";
        const end = source.indexOf("(?:");
        const mounted = layer.path ||
          (source.startsWith("^\\/") ? source.slice(1, end > 0 ? end : undefined).replaceAll("\\/", "/") : "");
        walk(layer.handle.stack, `${prefix}${mounted}`);
      }
    }
  }
  walk((app as ExpressWithRouter).router?.stack);
  return operations;
}

type ExpressWithRouter = typeof app & { router?: { stack?: Layer[] } };

function documentedOperations(): Array<{ method: string; path: string }> {
  const operations: Array<{ method: string; path: string }> = [];
  for (const match of spec.matchAll(/^  (\/[^:]+):\n([\s\S]*?)(?=^  \/.+:\n|^components:)/gm)) {
    for (const method of match[2].matchAll(/^\s{4}(get|post|put|patch|delete):/gm)) {
      operations.push({ method: method[1].toUpperCase(), path: match[1] });
    }
  }
  return operations;
}

describe("OpenAPI registered route contract", () => {
  it("documents only assembled method/path pairs", () => {
    const registered = registeredOperations();
    for (const { method, path } of documentedOperations()) {
      const expressPath = `/api${path}`.replace(/\{([^}]+)\}/g, ":$1");
      expect(registered, `${method} ${expressPath} is not registered`).toContain(`${method} ${expressPath}`);
    }
  });

  it("serves representative transport-safe routes through the assembled app", async () => {
    expect((await request(app).get("/api/healthz")).status).toBe(200);
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    expect((await request(app).get("/api/v1/member-sync")).status).toBe(401);
    expect((await request(app).post("/api/v1/member-work").send({})).status).toBe(401);
  });

  it("applies the existing iOS version and API contract gate to every early control surface", async () => {
    vi.stubEnv("ENFORCE_MIN_IOS_VERSION", "true");
    vi.stubEnv("MIN_IOS_APP_VERSION", "1.0.0");
    vi.stubEnv("KNOWLEDGE_CONTROL_ENABLED", "true");
    try {
      for (const path of [
        "/api/knowledge-control/tenant/scope",
        "/api/knowledge-control/global/metadata",
        "/api/knowledge-control/tenant/commands",
      ]) {
        for (const [version, contract] of [
          ["0.9.0", String(API_CONTRACT_VERSION)],
          ["1.0.0", "0"],
        ]) {
          const call = path.endsWith("commands")
            ? request(app).post(path).send({})
            : request(app).get(path);
          const response = await call
            .set("Authorization", "Bearer synthetic-native-session")
            .set("x-client-platform", "ios")
            .set("x-client-version", version)
            .set("x-client-api-contract", contract);
          expect(response.status).toBe(426);
          expect(response.body.code).toBe("CLIENT_UPGRADE_REQUIRED");
          expect(response.headers["cache-control"]).toContain("no-store");
        }
      }
      expect(
        (
          await request(app)
            .get("/api/knowledge-control/tenant/scope")
            .set("x-client-platform", "ios")
            .set("x-client-version", "1.0.0")
            .set("x-client-api-contract", String(API_CONTRACT_VERSION))
        ).status,
      ).toBe(401);
      expect(
        (
          await request(app)
            .get("/api/healthz")
            .set("x-client-platform", "ios")
            .set("x-client-version", "0.0.0")
        ).status,
      ).toBe(200);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("validates authenticated in-memory success fixtures with generated schemas", () => {
    const record = {
      recordType: "member-work", recordId: "work-1", mutationId: "device-1",
      payload: { output: { summary: "kept" } }, clientUpdatedAt: new Date().toISOString(), isDeleted: false,
      updatedAt: new Date().toISOString(),
    };
    expect(GetMemberSyncResponse.parse({ records: [record], serverTime: new Date().toISOString() }).records).toHaveLength(1);
    expect(PostMemberSyncResponse.parse({
      records: [record], serverTime: new Date().toISOString(), conflicts: 0, rejected: [],
    }).conflicts).toBe(0);
    const item = { id: "work-1", kind: "tool_result", output: { future: true } };
    expect(ListMemberWorkResponse.parse({ items: [item] }).items).toHaveLength(1);
    expect(CreateMemberWorkResponse.parse({ item }).item).toMatchObject({ id: "work-1" });
  });
});