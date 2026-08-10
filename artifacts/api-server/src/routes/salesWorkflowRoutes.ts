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
  detectAccountDuplicates,
  listAccountIntelligence,
  mergeAccounts,
  updateAccountIntelligence,
} from "../sales/accountIntelligenceLoad";

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
   * Account intelligence (HSP-13 Slice A): enriched list, search/filter,
   * optional consumer projection, optional duplicate scan.
   * Query: q, territoryId, branch, accountType, priority, relationshipStage,
   * includeArchived, ownerUserId, consumer, duplicates=true
   */
  app.get(
    "/api/v1/sales-workflow/accounts/intelligence",
    requireFieldKit,
    async (req, res) => {
      try {
        const actor = resolveActor(req);
        const query = req.query as Record<string, unknown>;
        const consumer =
          typeof query.consumer === "string" ? query.consumer : null;
        const listed = await listAccountIntelligence(
          storage,
          actor,
          query,
          consumer,
        );
        const payload: Record<string, unknown> = {
          accounts: listed.accounts,
          total: listed.total,
          filters: listed.filters,
        };
        if (query.duplicates === "true" || query.duplicates === true) {
          const { pairs } = await detectAccountDuplicates(storage, actor);
          payload.duplicatePairs = pairs;
        }
        res.json(payload);
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) console.error("accounts/intelligence GET failed:", error);
        res.status(status).json({
          error: {
            code: err.code ?? "INTELLIGENCE_LIST_FAILED",
            message:
              status < 500
                ? err.message || "Could not list account intelligence."
                : "Could not list account intelligence.",
          },
        });
      }
    },
  );

  /**
   * Update material account intelligence fields (optimistic concurrency).
   * Body: expectedVersion + name|accountType|address|territoryId|branch|
   * relationshipStage|priority|referralPotential|notes|archivedAt
   */
  app.patch(
    "/api/v1/sales-workflow/accounts/:accountId/intelligence",
    requireFieldKit,
    async (req, res) => {
      try {
        const actor = resolveActor(req);
        const accountId = String(req.params.accountId ?? "").trim();
        if (!accountId) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "accountId is required.",
            },
          });
          return;
        }
        const body = req.body ?? {};
        const expectedVersion = Number(body.expectedVersion);
        const account = await updateAccountIntelligence(
          storage,
          actor,
          accountId,
          expectedVersion,
          {
            name: body.name,
            accountType: body.accountType,
            address: body.address,
            territoryId: body.territoryId,
            branch: body.branch,
            relationshipStage: body.relationshipStage,
            priority: body.priority,
            referralPotential: body.referralPotential,
            notes: body.notes,
            archivedAt: body.archivedAt,
          },
        );
        res.json({ account });
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) {
          console.error("accounts/intelligence PATCH failed:", error);
        }
        res.status(status).json({
          error: {
            code: err.code ?? "INTELLIGENCE_UPDATE_FAILED",
            message:
              status < 500
                ? err.message || "Could not update account intelligence."
                : "Could not update account intelligence.",
          },
        });
      }
    },
  );

  /**
   * Merge absorb account into keep account (contacts/cycles/calls re-homed;
   * absorb soft-archived). Body: keepAccountId, absorbAccountId, keepExpectedVersion
   */
  app.post(
    "/api/v1/sales-workflow/accounts/intelligence/merge",
    requireFieldKit,
    async (req, res) => {
      try {
        const actor = resolveActor(req);
        const body = req.body ?? {};
        const keepAccountId =
          typeof body.keepAccountId === "string" ? body.keepAccountId.trim() : "";
        const absorbAccountId =
          typeof body.absorbAccountId === "string"
            ? body.absorbAccountId.trim()
            : "";
        if (!keepAccountId || !absorbAccountId) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "keepAccountId and absorbAccountId are required.",
            },
          });
          return;
        }
        const result = await mergeAccounts(
          storage,
          actor,
          keepAccountId,
          absorbAccountId,
          Number(body.keepExpectedVersion),
        );
        res.json(result);
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) {
          console.error("accounts/intelligence/merge failed:", error);
        }
        res.status(status).json({
          error: {
            code: err.code ?? "INTELLIGENCE_MERGE_FAILED",
            message:
              status < 500
                ? err.message || "Could not merge accounts."
                : "Could not merge accounts.",
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
