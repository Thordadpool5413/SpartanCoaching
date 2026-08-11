/**
 * AI threat-scan API (HSP-19 Slice A).
 * Detects prompt-injection / exfil patterns without calling the model.
 */
import type { Express } from "express";
import { z } from "zod";
import { requireFieldKit } from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import {
  scanPromptInjection,
  safeInjectionLogFields,
  PROMPT_SECURITY_VERSION,
  SYSTEM_POLICY_GUARDRAILS,
} from "@workspace/spartan-ai-tools/server";

const bodySchema = z
  .object({
    text: z.string().min(1).max(40_000),
  })
  .strict();

export function registerAiSecurityRoutes(app: Express): void {
  app.post(
    "/api/v1/security/ai-threat-scan",
    requireFieldKit,
    lightAiLimit,
    async (req, res) => {
      try {
        const parsed = bodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Provide text to scan.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }
        const result = scanPromptInjection(parsed.data.text);
        if (result.hasAny) {
          console.info("ai-threat-scan", safeInjectionLogFields(result));
        }
        res.json({
          promptSecurityVersion: PROMPT_SECURITY_VERSION,
          shouldBlock: result.shouldBlock,
          hasHighRisk: result.hasHighRisk,
          findings: result.findings,
          /** Policy is server-owned; never accept client system prompts. */
          systemPolicyOwnedByServer: true,
          policyExcerpt: SYSTEM_POLICY_GUARDRAILS.slice(0, 240),
        });
      } catch (error) {
        console.error("ai-threat-scan failed:", error);
        res.status(500).json({
          error: {
            code: "AI_THREAT_SCAN_FAILED",
            message: "Could not scan for AI threats.",
          },
        });
      }
    },
  );
}
