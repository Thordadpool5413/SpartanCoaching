/**
 * Trusted AI result persistence (HSP-21 Slice A).
 * Tenant + member scoped. In-memory for Slice A (durable DB later).
 *
 * Endpoints (3):
 *   GET    /api/v1/ai-results/saved
 *   POST   /api/v1/ai-results/saved
 *   DELETE /api/v1/ai-results/saved/:id
 *
 * Semantic assembly lives in trustedAiResult.ts and is attached on tool
 * responses (e.g. /api/objections) — not a separate public normalize API.
 */
import type { Express } from "express";
import { z } from "zod";
import { requireFieldKit, type AuthedRequest } from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import {
  TRUSTED_AI_RESULT_VERSION,
  deleteSavedTrustedAiResult,
  listSavedTrustedAiResults,
  saveTrustedAiResult,
  type TrustedAiResult,
} from "../ai/trustedAiResult";

const sourceAuthoritySchema = z.enum([
  "spartan_methodology",
  "provider_approved",
  "cms_policy_snapshot",
  "user_supplied_context",
  "model_generated",
  "unknown",
]);

const sourceBasisSchema = z
  .object({
    id: z.string().min(1).max(120),
    title: z.string().min(1).max(300),
    authority: sourceAuthoritySchema,
    kind: z.string().max(80).optional(),
    sourceUrl: z.string().max(500).optional(),
    snapshotId: z.string().max(120).optional(),
    documentId: z.string().max(120).optional(),
    disclaimer: z.string().max(500).optional(),
  })
  .strict();

const trustedResultSchema = z
  .object({
    schemaVersion: z.string().min(1).max(64),
    toolId: z.string().min(1).max(96),
    toolLabel: z.string().max(120).optional(),
    recommendation: z.string().max(4_000).optional(),
    suggestedWording: z.string().max(20_000).optional(),
    whyThisFits: z.string().max(4_000).optional(),
    nextMove: z.string().max(2_000).optional(),
    professionalBoundary: z.string().min(1).max(2_000),
    sourceBasis: z.array(sourceBasisSchema).max(30),
    spartanMethodologyBasis: z.array(z.string().max(300)).max(20),
    providerGuidance: z.string().max(4_000).optional(),
    uncertainty: z.string().max(2_000).optional(),
    relatedToolIds: z.array(z.string().max(96)).max(20),
    relatedResourceIds: z.array(z.string().max(96)).max(20),
    feedback: z
      .object({
        enabled: z.boolean(),
        hint: z.string().max(300).optional(),
      })
      .strict(),
    actions: z
      .object({
        canSave: z.boolean(),
        canCopy: z.boolean(),
        canShare: z.boolean(),
      })
      .strict(),
    plainText: z.string().max(40_000),
    retention: z.enum([
      "ephemeral",
      "member_saved",
      "run_persisted",
      "clinical_ephemeral",
    ]),
    recoverable: z.boolean(),
    trustNotice: z.string().min(1).max(500),
    createdAt: z.string().min(1).max(64),
  })
  .strict();

const saveBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    result: trustedResultSchema,
  })
  .strict();

function memberOrgId(req: AuthedRequest): number | null {
  const id = req.fieldKit?.member?.organizationId;
  return typeof id === "number" && id > 0 ? id : null;
}

function memberId(req: AuthedRequest): number | null {
  const id = req.clientMemberId ?? req.fieldKit?.member?.id;
  return typeof id === "number" && id > 0 ? id : null;
}

export function registerTrustedAiResultRoutes(app: Express): void {
  /** List member-owned saved results within the session organization. */
  app.get(
    "/api/v1/ai-results/saved",
    requireFieldKit,
    lightAiLimit,
    async (req, res) => {
      try {
        const authed = req as AuthedRequest;
        const organizationId = memberOrgId(authed);
        const mid = memberId(authed);
        if (!organizationId || !mid) {
          res.status(401).json({
            error: {
              code: "UNAUTHORIZED",
              message: "Membership session was not resolved.",
            },
          });
          return;
        }
        const toolId =
          typeof req.query.toolId === "string" && req.query.toolId.trim()
            ? req.query.toolId.trim()
            : undefined;
        const items = listSavedTrustedAiResults({
          organizationId,
          memberId: mid,
          toolId,
        });
        res.json({
          schemaVersion: TRUSTED_AI_RESULT_VERSION,
          items,
          persistence: "in_memory_slice_a",
        });
      } catch (error) {
        console.error("ai-results/saved list failed:", error);
        res.status(500).json({
          error: {
            code: "LIST_SAVED_FAILED",
            message: "Could not list saved AI results.",
          },
        });
      }
    },
  );

  /** Persist a trusted result for the authenticated member (tenant isolated). */
  app.post(
    "/api/v1/ai-results/saved",
    requireFieldKit,
    lightAiLimit,
    async (req, res) => {
      try {
        const authed = req as AuthedRequest;
        const organizationId = memberOrgId(authed);
        const mid = memberId(authed);
        if (!organizationId || !mid) {
          res.status(401).json({
            error: {
              code: "UNAUTHORIZED",
              message: "Membership session was not resolved.",
            },
          });
          return;
        }
        const parsed = saveBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Provide title and a trusted result envelope.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }
        const record = saveTrustedAiResult({
          organizationId,
          memberId: mid,
          title: parsed.data.title,
          // Zod widens schemaVersion to string; runtime still carries v1 envelope.
          result: parsed.data.result as TrustedAiResult,
        });
        res.status(201).json({ item: record });
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) {
          console.error("ai-results/saved create failed:", error);
        }
        res.status(status).json({
          error: {
            code: err.code ?? "SAVE_FAILED",
            message:
              status < 500 ? err.message : "Could not save AI result.",
          },
        });
      }
    },
  );

  /** Delete a member-owned saved result. */
  app.delete(
    "/api/v1/ai-results/saved/:id",
    requireFieldKit,
    lightAiLimit,
    async (req, res) => {
      try {
        const authed = req as AuthedRequest;
        const organizationId = memberOrgId(authed);
        const mid = memberId(authed);
        if (!organizationId || !mid) {
          res.status(401).json({
            error: {
              code: "UNAUTHORIZED",
              message: "Membership session was not resolved.",
            },
          });
          return;
        }
        const id = String(req.params.id || "").trim();
        if (!id) {
          res.status(400).json({
            error: { code: "INVALID_ID", message: "Saved result id required." },
          });
          return;
        }
        const ok = deleteSavedTrustedAiResult({
          organizationId,
          memberId: mid,
          id,
        });
        if (!ok) {
          res.status(404).json({
            error: {
              code: "NOT_FOUND",
              message: "Saved result not found for this member.",
            },
          });
          return;
        }
        res.status(204).send();
      } catch (error) {
        console.error("ai-results/saved delete failed:", error);
        res.status(500).json({
          error: {
            code: "DELETE_FAILED",
            message: "Could not delete saved AI result.",
          },
        });
      }
    },
  );
}
