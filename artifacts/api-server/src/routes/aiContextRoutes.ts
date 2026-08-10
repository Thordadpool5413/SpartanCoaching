/**
 * Structured AI context assembly API (HSP-14 Slice A).
 * Preview/review only — does not call the model.
 * Privileged layers are assembled server-side; clients cannot inject them.
 */
import type { Express } from "express";
import { z } from "zod";
import { requireFieldKit, type AuthedRequest } from "../auth/middleware";
import {
  assembleStructuredAiContext,
  safeContextLogFields,
} from "../ai/aiContextAssembly";
import { searchSpartanKnowledge } from "../knowledge/spartanCorpus";

const assembleBodySchema = z
  .object({
    toolId: z.string().trim().min(1).max(96),
    request: z.record(z.string(), z.unknown()).default({}),
    account: z
      .object({
        accountId: z.string().trim().max(80).optional(),
        accountName: z.string().trim().max(200).optional(),
        accountType: z.string().trim().max(100).optional(),
        relationshipStage: z.string().trim().max(120).optional(),
        currentObjective: z.string().trim().max(500).optional(),
        knownObjections: z.array(z.string().max(300)).max(12).optional(),
        primaryContactName: z.string().trim().max(120).optional(),
        notes: z.string().trim().max(2000).optional(),
        capturedAt: z.string().trim().max(40).optional(),
      })
      .strict()
      .optional(),
    corrections: z
      .object({
        accountId: z.string().trim().max(80).optional(),
        accountName: z.string().trim().max(200).optional(),
        accountType: z.string().trim().max(100).optional(),
        relationshipStage: z.string().trim().max(120).optional(),
        currentObjective: z.string().trim().max(500).optional(),
        knownObjections: z.array(z.string().max(300)).max(12).optional(),
        primaryContactName: z.string().trim().max(120).optional(),
        notes: z.string().trim().max(2000).optional(),
        capturedAt: z.string().trim().max(40).optional(),
      })
      .strict()
      .optional(),
    user: z
      .object({
        roleLabel: z.string().trim().max(80).optional(),
        territoryHint: z.string().trim().max(120).optional(),
        focus: z.string().trim().max(300).optional(),
      })
      .strict()
      .optional(),
    knowledgeQuery: z.string().trim().max(500).optional(),
    maxKnowledgeHits: z.number().int().min(0).max(8).optional(),
    /** When true, include assembled layer text for human review (never log server-side). */
    includeLayers: z.boolean().optional(),
  })
  .strict();

export function registerAiContextRoutes(app: Express): void {
  /**
   * Assemble structured AI context for review/correction.
   * Server owns system/methodology/knowledge/provider layers.
   * Response metadata is safe to store; layer bodies optional via includeLayers.
   */
  app.post(
    "/api/v1/ai-context/assemble",
    requireFieldKit,
    async (req, res) => {
      try {
        const parsed = assembleBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Invalid AI context assemble payload.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }

        const authed = req as AuthedRequest;
        const member = authed.fieldKit?.member;
        if (!member) {
          res.status(401).json({
            error: {
              code: "UNAUTHORIZED",
              message: "Membership session was not resolved.",
            },
          });
          return;
        }

        const body = parsed.data;
        const knowledgeQuery =
          body.knowledgeQuery ||
          [
            body.account?.currentObjective,
            body.account?.accountType,
            typeof body.request.notes === "string" ? body.request.notes : "",
            typeof body.request.objection === "string"
              ? body.request.objection
              : "",
          ]
            .filter(Boolean)
            .join(" ");

        const knowledgeHits = knowledgeQuery
          ? searchSpartanKnowledge(knowledgeQuery, body.maxKnowledgeHits ?? 3)
          : [];

        const pkg = assembleStructuredAiContext({
          toolId: body.toolId,
          tenant: {
            organizationId: member.organizationId,
            memberId: member.id,
          },
          model: process.env.OPENAI_MODEL,
          knowledgeHits,
          account: body.account,
          corrections: body.corrections,
          user: body.user ?? {
            roleLabel:
              member.role === "org_admin" || member.role === "platform_admin"
                ? "manager"
                : "rep",
          },
          request: body.request,
          maxKnowledgeHits: body.maxKnowledgeHits ?? 3,
        });

        console.info(
          "ai-context/assemble",
          safeContextLogFields(pkg.metadata),
        );

        res.json({
          metadata: pkg.metadata,
          reviewableFacts: pkg.reviewableFacts,
          /** Layer bodies only when client opts in for review UI — not for logging. */
          layers: body.includeLayers ? pkg.layers : undefined,
          messageRoles: pkg.messages.map((m) => m.role),
          messageByteLengths: pkg.messages.map((m) =>
            Buffer.byteLength(m.content, "utf8"),
          ),
        });
      } catch (error) {
        console.error("ai-context/assemble failed:", error);
        res.status(500).json({
          error: {
            code: "AI_CONTEXT_ASSEMBLE_FAILED",
            message: "Could not assemble AI context.",
          },
        });
      }
    },
  );
}
