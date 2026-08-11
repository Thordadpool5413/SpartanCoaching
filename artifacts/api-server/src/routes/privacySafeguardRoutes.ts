/**
 * Privacy / sensitive-data scan API (HSP-18 Slice A).
 * Contextual warnings for free text — does not store scanned content.
 * Does not claim HIPAA compliance.
 */
import type { Express } from "express";
import { z } from "zod";
import { requireFieldKit } from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import {
  evaluateFileUploadSafety,
  HIPAA_COMPLIANCE_CLAIM,
  RETENTION_POLICY,
  SENSITIVE_DATA_WARNING,
  scanSensitiveText,
  safeSensitiveLogFields,
  type SensitiveScanMode,
} from "../security/sensitiveDataSafeguards";

const scanBodySchema = z
  .object({
    text: z.string().max(40_000),
    mode: z.enum(["detect", "redact", "block"]).default("detect"),
    channel: z
      .enum([
        "free_text",
        "ai_prompt",
        "analytics",
        "notification",
        "url",
        "log",
        "support_ticket",
        "file_metadata",
      ])
      .default("free_text"),
  })
  .strict();

export function registerPrivacySafeguardRoutes(app: Express): void {
  /**
   * Scan free text for sensitive patterns. Returns codes + warnings only
   * (matched values never echoed). Optional redact mode returns redacted text.
   */
  app.post(
    "/api/v1/privacy/scan-text",
    requireFieldKit,
    lightAiLimit,
    async (req, res) => {
      try {
        const parsed = scanBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Provide text (string) to scan.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }
        const result = scanSensitiveText(
          parsed.data.text,
          parsed.data.mode as SensitiveScanMode,
          parsed.data.channel,
        );
        // Safe server log — codes only
        if (result.hasAny) {
          console.info("privacy/scan-text", safeSensitiveLogFields(result));
        }
        res.json({
          hasHighRisk: result.hasHighRisk,
          hasAny: result.hasAny,
          blocked: result.blocked,
          redacted: result.redacted,
          findings: result.findings.map((f) => ({
            code: f.code,
            severity: f.severity,
          })),
          warnings: result.warnings,
          /** Only returned when mode=redact — never raw input. */
          redactedText: result.redacted ? result.text : undefined,
          contextualWarning: SENSITIVE_DATA_WARNING,
          hipaaNote: HIPAA_COMPLIANCE_CLAIM,
          safeguardsVersion: result.safeguardsVersion,
        });
      } catch (error) {
        console.error("privacy/scan-text failed:", error);
        res.status(500).json({
          error: {
            code: "PRIVACY_SCAN_FAILED",
            message: "Could not scan text.",
          },
        });
      }
    },
  );

  /** Product privacy policy snapshot for clients (warnings + retention posture). */
  app.get("/api/v1/privacy/policy-snapshot", requireFieldKit, (_req, res) => {
    res.json({
      contextualWarning: SENSITIVE_DATA_WARNING,
      hipaaNote: HIPAA_COMPLIANCE_CLAIM,
      retention: RETENTION_POLICY,
      fileUpload: evaluateFileUploadSafety({}),
      channelsForbiddenForSensitiveText: [
        "url",
        "push_notification",
        "analytics_metadata",
        "crash_logs",
        "support_tickets",
      ],
    });
  });
}
