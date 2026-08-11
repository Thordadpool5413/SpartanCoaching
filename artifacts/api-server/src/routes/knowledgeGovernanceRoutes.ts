/**
 * Knowledge governance admin API (HSP-16 Slice A).
 * Lifecycle, version history, review reminders, supersede, source display.
 * Three endpoints only (budget).
 */
import type { Express } from "express";
import { z } from "zod";
import { requireFieldKit, type AuthedRequest } from "../auth/middleware";
import {
  buildSourceDisplay,
  ensureCoreSeeded,
  getGovernedItem,
  listGovernedItems,
  listReviewReminders,
  listVersionHistory,
  retireKnowledgeItem,
  supersedeKnowledgeItem,
  upsertProviderGovernedItem,
  type KnowledgeItemStatus,
  type KnowledgeSourceType,
  type ConfidenceClassification,
} from "../knowledge/knowledgeGovernance";

const sourceTypeSchema = z.enum([
  "spartan_methodology",
  "regulation",
  "medicare_guidance",
  "hospice_education",
  "provider_policy",
  "sales_practice",
]);

const statusSchema = z.enum(["draft", "current", "retired", "superseded"]);

const upsertBodySchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(8000),
    sourceType: sourceTypeSchema.default("provider_policy"),
    sourceDocument: z.string().trim().max(300).optional(),
    sourceLocation: z.string().trim().max(500).optional(),
    sourceOrganizationName: z.string().trim().max(200).optional(),
    publicationDate: z.string().trim().max(40).optional(),
    effectiveDate: z.string().trim().max(40).optional(),
    reviewedDate: z.string().trim().max(40).optional(),
    reviewer: z.string().trim().max(120).optional(),
    clinicalReviewer: z.string().trim().max(120).optional(),
    complianceReviewer: z.string().trim().max(120).optional(),
    version: z.string().trim().max(40).optional(),
    jurisdiction: z.string().trim().max(80).optional(),
    reviewIntervalDays: z.number().int().min(30).max(3650).optional(),
    status: statusSchema.optional(),
    tags: z.array(z.string().max(40)).max(30).optional(),
    confidence: z
      .enum(["high", "medium", "low", "provisional"])
      .optional(),
  })
  .strict();

const lifecycleBodySchema = z
  .object({
    action: z.enum(["supersede", "retire"]),
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).max(8000).optional(),
    sourceType: sourceTypeSchema.optional(),
    version: z.string().trim().max(40).optional(),
    status: statusSchema.optional(),
    sourceDocument: z.string().trim().max(300).optional(),
    sourceLocation: z.string().trim().max(500).optional(),
    reviewedDate: z.string().trim().max(40).optional(),
    reviewer: z.string().trim().max(120).optional(),
    clinicalReviewer: z.string().trim().max(120).optional(),
    complianceReviewer: z.string().trim().max(120).optional(),
    effectiveDate: z.string().trim().max(40).optional(),
    publicationDate: z.string().trim().max(40).optional(),
    jurisdiction: z.string().trim().max(80).optional(),
    reviewIntervalDays: z.number().int().min(30).max(3650).optional(),
    tags: z.array(z.string().max(40)).max(30).optional(),
    confidence: z
      .enum(["high", "medium", "low", "provisional"])
      .optional(),
  })
  .strict();

function memberOrgId(req: AuthedRequest): number | null {
  const id = req.fieldKit?.member?.organizationId;
  return typeof id === "number" && id > 0 ? id : null;
}

function isOrgAdmin(req: AuthedRequest): boolean {
  const role = req.fieldKit?.member?.role;
  return role === "org_admin" || role === "platform_admin";
}

function isPlatformAdmin(req: AuthedRequest): boolean {
  return req.fieldKit?.member?.role === "platform_admin";
}

export function registerKnowledgeGovernanceRoutes(app: Express): void {
  ensureCoreSeeded();

  /**
   * List governed items with source display.
   * Query: status, sourceType, reminders=true, historyOf=<id|lineageId>
   */
  app.get(
    "/api/v1/knowledge/governance/items",
    requireFieldKit,
    async (req, res) => {
      try {
        const authed = req as AuthedRequest;
        const organizationId = memberOrgId(authed);
        if (!organizationId) {
          res.status(401).json({
            error: {
              code: "UNAUTHORIZED",
              message: "Membership session was not resolved.",
            },
          });
          return;
        }

        if (typeof req.query.historyOf === "string" && req.query.historyOf.trim()) {
          const id = req.query.historyOf.trim();
          const item = getGovernedItem(id);
          const lineageId = item?.lineageId ?? id;
          const history = listVersionHistory(lineageId).map((h) => ({
            ...h,
            sourceDisplay: buildSourceDisplay(h),
          }));
          res.json({ lineageId, history });
          return;
        }

        const status = req.query.status
          ? String(req.query.status)
          : undefined;
        const sourceType = req.query.sourceType
          ? String(req.query.sourceType)
          : undefined;
        const items = listGovernedItems({
          organizationId,
          status: status as KnowledgeItemStatus | undefined,
          sourceType: sourceType as KnowledgeSourceType | undefined,
          includeSharedCore: true,
        });
        const withDisplay = items.map((item) => ({
          ...item,
          sourceDisplay: buildSourceDisplay(item),
        }));
        const reminders =
          req.query.reminders === "true"
            ? listReviewReminders({ organizationId })
            : undefined;
        res.json({
          items: withDisplay,
          reminders,
          count: withDisplay.length,
        });
      } catch (error) {
        console.error("governance/items GET failed:", error);
        res.status(500).json({
          error: {
            code: "GOVERNANCE_LIST_FAILED",
            message: "Could not list governed knowledge.",
          },
        });
      }
    },
  );

  /**
   * Upsert provider-policy knowledge with full governance metadata.
   * Org admin. Core corpus is seed-only in Slice A (platform admin for other types).
   */
  app.put(
    "/api/v1/knowledge/governance/items",
    requireFieldKit,
    async (req, res) => {
      try {
        const authed = req as AuthedRequest;
        const organizationId = memberOrgId(authed);
        if (!organizationId) {
          res.status(401).json({
            error: {
              code: "UNAUTHORIZED",
              message: "Membership session was not resolved.",
            },
          });
          return;
        }
        if (!isOrgAdmin(authed) && !isPlatformAdmin(authed)) {
          res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "Organization administrator access is required.",
            },
          });
          return;
        }
        const parsed = upsertBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Invalid governance item payload.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }
        if (
          parsed.data.sourceType !== "provider_policy" &&
          !isPlatformAdmin(authed)
        ) {
          res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message:
                "Only platform administrators may publish non-provider source types via API in Slice A.",
            },
          });
          return;
        }
        const item = upsertProviderGovernedItem(organizationId, {
          ...parsed.data,
          status: parsed.data.status as KnowledgeItemStatus | undefined,
          confidence: parsed.data.confidence as
            | ConfidenceClassification
            | undefined,
        });
        res.json({
          item,
          sourceDisplay: buildSourceDisplay(item),
        });
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) console.error("governance/items PUT failed:", error);
        res.status(status).json({
          error: {
            code: err.code ?? "GOVERNANCE_UPSERT_FAILED",
            message:
              status < 500 ? err.message : "Could not save governed knowledge.",
          },
        });
      }
    },
  );

  /**
   * Lifecycle: supersede (replace with new version) or retire.
   * Body: { action: "supersede"|"retire", ...fields for supersede }
   */
  app.post(
    "/api/v1/knowledge/governance/items/:id/lifecycle",
    requireFieldKit,
    async (req, res) => {
      try {
        const authed = req as AuthedRequest;
        const organizationId = memberOrgId(authed);
        if (!organizationId) {
          res.status(401).json({
            error: {
              code: "UNAUTHORIZED",
              message: "Membership session was not resolved.",
            },
          });
          return;
        }
        if (!isOrgAdmin(authed) && !isPlatformAdmin(authed)) {
          res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "Organization administrator access is required.",
            },
          });
          return;
        }
        const id = String(req.params.id ?? "").trim();
        const existing = getGovernedItem(id);
        if (!existing) {
          res.status(404).json({
            error: { code: "NOT_FOUND", message: "Knowledge item not found." },
          });
          return;
        }
        if (
          existing.sourceOrganizationId != null &&
          existing.sourceOrganizationId !== organizationId &&
          !isPlatformAdmin(authed)
        ) {
          res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "Item belongs to another organization.",
            },
          });
          return;
        }
        const parsed = lifecycleBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Invalid lifecycle payload.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }

        if (parsed.data.action === "retire") {
          const item = retireKnowledgeItem(id);
          res.json({
            action: "retire",
            item,
            sourceDisplay: buildSourceDisplay(item),
          });
          return;
        }

        if (!parsed.data.title || !parsed.data.body) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Supersede requires title and body.",
            },
          });
          return;
        }

        const result = supersedeKnowledgeItem(id, {
          title: parsed.data.title,
          body: parsed.data.body,
          sourceType: (parsed.data.sourceType ??
            existing.sourceType) as KnowledgeSourceType,
          version: parsed.data.version,
          status: (parsed.data.status ?? "current") as KnowledgeItemStatus,
          sourceDocument: parsed.data.sourceDocument,
          sourceLocation: parsed.data.sourceLocation,
          reviewedDate: parsed.data.reviewedDate,
          reviewer: parsed.data.reviewer,
          clinicalReviewer: parsed.data.clinicalReviewer,
          complianceReviewer: parsed.data.complianceReviewer,
          effectiveDate: parsed.data.effectiveDate,
          publicationDate: parsed.data.publicationDate,
          jurisdiction: parsed.data.jurisdiction,
          reviewIntervalDays: parsed.data.reviewIntervalDays,
          tags: parsed.data.tags,
          confidence: parsed.data.confidence as
            | ConfidenceClassification
            | undefined,
        });
        res.json({
          action: "supersede",
          previous: {
            ...result.previous,
            sourceDisplay: buildSourceDisplay(result.previous),
          },
          next: {
            ...result.next,
            sourceDisplay: buildSourceDisplay(result.next),
          },
          history: listVersionHistory(result.previous.lineageId).map((h) => ({
            id: h.id,
            version: h.version,
            status: h.status,
            updatedAt: h.updatedAt,
            sourceDisplay: buildSourceDisplay(h),
          })),
        });
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) {
          console.error("governance lifecycle failed:", error);
        }
        res.status(status).json({
          error: {
            code: err.code ?? "GOVERNANCE_LIFECYCLE_FAILED",
            message:
              status < 500
                ? err.message
                : "Could not apply knowledge lifecycle action.",
          },
        });
      }
    },
  );
}
