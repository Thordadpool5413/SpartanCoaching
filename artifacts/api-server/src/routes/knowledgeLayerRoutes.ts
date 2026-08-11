/**
 * Three-layer knowledge retrieve API (HSP-15 Slice A).
 * Provider knowledge is scoped to the authenticated organization only.
 */
import type { Express } from "express";
import { z } from "zod";
import { requireFieldKit, type AuthedRequest } from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import {
  citationsFromThreeLayer,
  retrieveThreeLayerKnowledge,
  setProviderKnowledgeForOrg,
  getProviderKnowledgeForOrg,
  type ProviderKnowledgeDoc,
  type ProviderKnowledgeKind,
} from "../knowledge/threeLayerKnowledge";

const userContextSchema = z
  .object({
    territoryHint: z.string().trim().max(120).optional(),
    accountName: z.string().trim().max(200).optional(),
    accountType: z.string().trim().max(100).optional(),
    relationshipStage: z.string().trim().max(120).optional(),
    currentObjective: z.string().trim().max(500).optional(),
    lastInteractionSummary: z.string().trim().max(500).optional(),
    nextAction: z.string().trim().max(300).optional(),
    goals: z.array(z.string().max(200)).max(8).optional(),
  })
  .strict()
  .optional();

const retrieveBodySchema = z
  .object({
    query: z.string().trim().min(2).max(500),
    userContext: userContextSchema,
    maxCore: z.number().int().min(0).max(10).optional(),
    maxProvider: z.number().int().min(0).max(10).optional(),
    includeUserContext: z.boolean().optional(),
  })
  .strict();

const providerDocSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(200),
    kind: z.enum([
      "service",
      "policy",
      "capability",
      "terminology",
      "claim",
      "resource",
      "process",
    ]),
    body: z.string().trim().min(1).max(4000),
    tags: z.array(z.string().max(40)).max(20).default([]),
    claimStrength: z
      .enum(["marketing", "operational", "policy"])
      .optional(),
  })
  .strict();

const replaceProviderSchema = z
  .object({
    documents: z.array(providerDocSchema).max(100),
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

export function registerKnowledgeLayerRoutes(app: Express): void {
  /**
   * Retrieve Core + Provider + User Context with conflict resolution.
   * Organization id always from session — never from client body.
   */
  app.post(
    "/api/v1/knowledge/layers/retrieve",
    requireFieldKit,
    lightAiLimit,
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

        const parsed = retrieveBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Provide query (min 2 chars) and optional userContext.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }

        const result = retrieveThreeLayerKnowledge({
          query: parsed.data.query,
          organizationId,
          userContext: parsed.data.userContext,
          maxCore: parsed.data.maxCore,
          maxProvider: parsed.data.maxProvider,
          includeUserContext: parsed.data.includeUserContext,
        });

        res.json({
          ...result,
          citations: citationsFromThreeLayer(result),
        });
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) {
          console.error("knowledge/layers/retrieve failed:", error);
        }
        res.status(status).json({
          error: {
            code: err.code ?? "KNOWLEDGE_RETRIEVE_FAILED",
            message:
              status < 500
                ? err.message
                : "Could not retrieve layered knowledge.",
          },
        });
      }
    },
  );

  /**
   * Replace provider knowledge documents for the authenticated org only.
   * Org admin / platform admin. No cross-tenant write path.
   */
  app.put(
    "/api/v1/knowledge/layers/provider",
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
        if (!isOrgAdmin(authed)) {
          res.status(403).json({
            error: {
              code: "FORBIDDEN",
              message: "Organization administrator access is required.",
            },
          });
          return;
        }

        const parsed = replaceProviderSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Provide documents[] for provider knowledge.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }

        const docs: ProviderKnowledgeDoc[] = parsed.data.documents.map((d) => ({
          ...d,
          organizationId,
          kind: d.kind as ProviderKnowledgeKind,
        }));
        setProviderKnowledgeForOrg(organizationId, docs);

        res.json({
          organizationId,
          count: getProviderKnowledgeForOrg(organizationId).length,
        });
      } catch (error) {
        console.error("knowledge/layers/provider PUT failed:", error);
        res.status(500).json({
          error: {
            code: "PROVIDER_KNOWLEDGE_WRITE_FAILED",
            message: "Could not update provider knowledge.",
          },
        });
      }
    },
  );

  /** List provider knowledge for the authenticated org (no foreign orgs). */
  app.get(
    "/api/v1/knowledge/layers/provider",
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
        res.json({
          organizationId,
          documents: getProviderKnowledgeForOrg(organizationId),
        });
      } catch (error) {
        console.error("knowledge/layers/provider GET failed:", error);
        res.status(500).json({
          error: {
            code: "PROVIDER_KNOWLEDGE_READ_FAILED",
            message: "Could not list provider knowledge.",
          },
        });
      }
    },
  );
}
