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
import {
  assertWorkflowAction,
  workflowActorFromMember,
} from "../auth/workflowTenantAuthz";
import { draftCallDebrief, draftDebriefInputSchema } from "../salesDebrief";
import { standardAiLimit, globalDailyAiCap } from "../rateLimits";
import {
  loadCommandCenterContext,
  saveContextCorrections,
} from "../sales/commandCenterContextLoad";
import { sanitizeCorrections } from "../sales/commandCenterContext";

function resolveActor(request: Request): Actor {
  const authed = request as AuthedRequest;
  const member = authed.fieldKit?.member;
  if (!member || !authed.clientMemberId) {
    throw new Error("Membership session was not resolved");
  }

  // Canonical int → workflow UUID mapping + role elevation (see @workspace/tenant-ids).
  const identity = workflowActorFromMember({
    memberId: member.id,
    organizationId: member.organizationId,
    role: member.role,
  });
  return {
    organizationId: identity.organizationId,
    userId: identity.userId,
    role: identity.role,
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
    try {
      assertWorkflowAction(
        {
          organizationId: actor.organizationId,
          userId: actor.userId,
          role: actor.role === "manager" ? "manager" : "rep",
        },
        action,
        resource,
      );
    } catch (error) {
      const err = error as Error & { code?: string; status?: number };
      throw new WorkflowError(
        (err.code as "FORBIDDEN") || "FORBIDDEN",
        err.status === 403 ? 403 : 403,
        err.message || "Forbidden",
      );
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

  /**
   * AI drafts a structured post-call debrief for the Complete Call form.
   * Does not write workflow records — user reviews/edits then completes the call.
   */
  app.post(
    "/api/v1/sales-workflow/debrief/draft",
    requireFieldKit,
    standardAiLimit,
    globalDailyAiCap,
    async (req, res) => {
      try {
        const parsed = draftDebriefInputSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Provide field notes (at least a few words) to draft a debrief.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }
        const result = await draftCallDebrief(parsed.data);
        res.json({
          draft: result.draft,
          source: result.source,
          model: result.model,
          disclaimer:
            "AI draft only. Edit before completing the call. Do not include patient-identifying information.",
        });
      } catch (error) {
        console.error("debrief/draft failed:", error);
        res.status(502).json({
          error: {
            code: "DEBRIEF_FAILED",
            message: "Could not draft debrief. Enter the call summary manually.",
          },
        });
      }
    },
  );

  /**
   * Command Center context engine (HSP-12).
   * Assembles reviewable account context from workflow entities.
   * Optional ?tool= projects allowlisted fields for satellite tools.
   */
  app.get(
    "/api/v1/sales-workflow/context",
    requireFieldKit,
    async (req, res) => {
      try {
        const accountId =
          typeof req.query.accountId === "string" ? req.query.accountId.trim() : "";
        if (!accountId) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Query parameter accountId is required.",
            },
          });
          return;
        }
        const toolId =
          typeof req.query.tool === "string" ? req.query.tool.trim() : null;
        const actor = resolveActor(req);
        const loaded = await loadCommandCenterContext(
          storage,
          actor,
          accountId,
          toolId,
        );
        res.json({
          context: loaded.context,
          toolProjection: loaded.toolProjection,
        });
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) console.error("context GET failed:", error);
        res.status(status).json({
          error: {
            code: err.code ?? "CONTEXT_LOAD_FAILED",
            message:
              status < 500
                ? err.message || "Could not load context."
                : "Could not load Command Center context.",
          },
        });
      }
    },
  );

  /**
   * Persist user corrections to material context fields (objective, objections, stage, priority, notes).
   * Stored as workflow activity type context_correction; re-assembles and returns full context.
   */
  app.patch(
    "/api/v1/sales-workflow/context",
    requireFieldKit,
    async (req, res) => {
      try {
        const body = req.body ?? {};
        const accountId =
          typeof body.accountId === "string" ? body.accountId.trim() : "";
        if (!accountId) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Body field accountId is required.",
            },
          });
          return;
        }
        const corrections = sanitizeCorrections({
          currentObjective: body.currentObjective,
          knownObjections: body.knownObjections,
          relationshipStage: body.relationshipStage,
          priority: body.priority,
          notes: body.notes,
        });
        if (Object.keys(corrections).length === 0) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message:
                "Provide at least one material field: currentObjective, knownObjections, relationshipStage, priority, or notes.",
            },
          });
          return;
        }
        const actor = resolveActor(req);
        const loaded = await saveContextCorrections(
          storage,
          actor,
          accountId,
          corrections,
        );
        res.json({
          context: loaded.context,
          corrections: loaded.context.corrections,
        });
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) console.error("context PATCH failed:", error);
        res.status(status).json({
          error: {
            code: err.code ?? "CONTEXT_SAVE_FAILED",
            message:
              status < 500
                ? err.message || "Could not save corrections."
                : "Could not save context corrections.",
          },
        });
      }
    },
  );

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
