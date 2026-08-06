import type { Express, Request } from "express";
import {
  AesGcmEncryption,
  CsvAccountImportAdapter,
  PostgresIdempotencyStore,
  PostgresWorkflowStorage,
  SalesWorkflowOrchestrator,
  WorkflowError,
  type Actor,
  type AuthorizationAdapter,
  type EncryptionAdapter,
} from "@workspace/hospice-sales-runtime/sales-workflow";
import { createWorkflowRouter } from "@workspace/hospice-sales-runtime/sales-workflow/express";
import { tool as planner } from "@workspace/hospice-sales-runtime/pre-call-planner";
import { tool as discovery } from "@workspace/hospice-sales-runtime/discovery-coach";
import { tool as objection } from "@workspace/hospice-sales-runtime/objection-coach";
import { tool as roleplayScenario } from "@workspace/hospice-sales-runtime/roleplay-scenario-coach";
import { tool as adaptiveRoleplay } from "@workspace/hospice-sales-runtime/adaptive-roleplay-response";
import { tool as callPerformance } from "@workspace/hospice-sales-runtime/call-performance-coach";
import { tool as coaching } from "@workspace/hospice-sales-runtime/coaching-feedback";
import { tool as email } from "@workspace/hospice-sales-runtime/email-optimizer";
import { pool } from "../db";
import { requireFieldKit, type AuthedRequest } from "../auth/middleware";

function stableUuid(namespace: string, value: number): string {
  const suffix = value.toString(16).padStart(12, "0").slice(-12);
  const variant = namespace === "spartan-organization" ? "8" : "9";
  return `00000000-0000-5000-${variant}000-${suffix}`;
}

function resolveActor(request: Request): Actor {
  const authed = request as AuthedRequest;
  const member = authed.fieldKit?.member;
  if (!member || !authed.clientMemberId) {
    throw new Error("Membership session was not resolved");
  }

  const administrator = member.role === "org_admin" || member.role === "platform_admin";
  return {
    organizationId: stableUuid("spartan-organization", member.organizationId),
    userId: stableUuid("spartan-member", member.id),
    role: administrator ? "manager" : "rep",
    teamIds: [],
    territoryIds: [],
  };
}

function workflowEncryption(): EncryptionAdapter | undefined {
  const key = process.env.SALES_WORKFLOW_ENCRYPTION_KEY;
  if (key) return new AesGcmEncryption(key);
  // Fail closed in deployed production when encryption is required by policy.
  const production =
    process.env.NODE_ENV === "production" ||
    process.env.REPLIT_DEPLOYMENT === "1" ||
    process.env.REPLIT_DEPLOYMENT === "true";
  if (production && process.env.SALES_WORKFLOW_REQUIRE_ENCRYPTION === "1") {
    throw new Error(
      "SALES_WORKFLOW_ENCRYPTION_KEY is required when SALES_WORKFLOW_REQUIRE_ENCRYPTION=1",
    );
  }
  return undefined;
}

const workflowAuthorization: AuthorizationAdapter = {
  assert(actor: Actor, action: string, resource?: { organizationId?: string; ownerUserId?: string }) {
    if (resource?.organizationId && resource.organizationId !== actor.organizationId) {
      throw new WorkflowError("FORBIDDEN", 403, "Resource is outside your organization");
    }
    if (action.startsWith("integration:") && actor.role !== "manager") {
      throw new WorkflowError(
        "FORBIDDEN",
        403,
        "Organization administrator access is required",
      );
    }
    if (action.startsWith("manager:") && actor.role !== "manager") {
      throw new WorkflowError("FORBIDDEN", 403, "Manager access is required");
    }
    if (resource?.ownerUserId && actor.role === "rep" && resource.ownerUserId !== actor.userId) {
      throw new WorkflowError("FORBIDDEN", 403, "You do not own this workflow");
    }
  },
};

export function registerSalesWorkflowRoutes(app: Express): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = new PostgresWorkflowStorage(pool as any);
  const orchestrator = new SalesWorkflowOrchestrator({
    storage,
    tools: {
      planner,
      discovery,
      objection,
      roleplayScenario,
      adaptiveRoleplay,
      callPerformance,
      coaching,
      email,
    },
    encryption: workflowEncryption(),
    authorization: workflowAuthorization,
    promptVersion: "spartan-sales-workflow-v1",
    schemaVersion: "1.0.0",
    crmSyncEnabled: false,
  });

  app.use(
    "/api/v1/sales-workflow",
    requireFieldKit,
    createWorkflowRouter({
      orchestrator,
      storage,
      resolveActor,
      importAdapter: new CsvAccountImportAdapter(storage),
      idempotencyStore: new PostgresIdempotencyStore(pool as any),
      maxBodyBytes: 1_000_000,
      authorization: workflowAuthorization,
    }),
  );
}
