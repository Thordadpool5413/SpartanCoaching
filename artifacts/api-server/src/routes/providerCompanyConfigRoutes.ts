/**
 * Provider company configuration API (HSP-17 Slice A).
 * Org-scoped CRUD + AI context package with PROVIDER-SOURCED labels.
 */
import type { Express } from "express";
import { z } from "zod";
import { requireFieldKit, type AuthedRequest } from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import {
  assertProviderOrgAccess,
  buildProviderAiContext,
  getProviderCompanyConfig,
  listProviderCompanyConfigVersions,
  upsertProviderCompanyConfig,
} from "../knowledge/providerCompanyConfig";

const stringList = z.array(z.string().max(500)).max(40).optional();

const putBodySchema = z
  .object({
    organizationDisplayName: z.string().trim().max(200).nullable().optional(),
    serviceAreas: stringList,
    branches: stringList,
    programs: stringList,
    coverageNotes: stringList,
    afterHoursCapabilities: stringList,
    admissionResponseStandards: stringList,
    approvedDifferentiators: stringList,
    approvedClaims: stringList,
    prohibitedClaims: stringList,
    preferredTerminology: z
      .array(
        z
          .object({
            term: z.string().trim().max(80),
            preferred: z.string().trim().max(120),
            notes: z.string().trim().max(300).optional(),
          })
          .strict(),
      )
      .max(40)
      .optional(),
    escalationContacts: z
      .array(
        z
          .object({
            role: z.string().trim().max(80),
            name: z.string().trim().max(120).optional(),
            channel: z.string().trim().max(200).optional(),
            notes: z.string().trim().max(300).optional(),
          })
          .strict(),
      )
      .max(20)
      .optional(),
    referralProcesses: stringList,
    payerNotes: stringList,
    brandVoice: z.string().trim().max(2000).nullable().optional(),
    approvedScripts: z
      .array(
        z
          .object({
            id: z.string().trim().max(80),
            title: z.string().trim().max(200),
            body: z.string().trim().max(4000),
          })
          .strict(),
      )
      .max(25)
      .optional(),
    companyResources: z
      .array(
        z
          .object({
            label: z.string().trim().max(200),
            url: z.string().trim().max(500).optional(),
            description: z.string().trim().max(500).optional(),
          })
          .strict(),
      )
      .max(30)
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

export function registerProviderCompanyConfigRoutes(app: Express): void {
  /**
   * Get current company configuration for the authenticated organization only.
   */
  app.get(
    "/api/v1/knowledge/provider/company-config",
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
        const orgId = assertProviderOrgAccess(organizationId);
        const config = getProviderCompanyConfig(orgId);
        const versions = listProviderCompanyConfigVersions(orgId);
        res.json({
          organizationId: orgId,
          config,
          versions,
        });
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) {
          console.error("company-config GET failed:", error);
        }
        res.status(status).json({
          error: {
            code: err.code ?? "COMPANY_CONFIG_READ_FAILED",
            message:
              status < 500
                ? err.message
                : "Could not load provider company configuration.",
          },
        });
      }
    },
  );

  /**
   * Replace/merge company configuration (org admin). Creates a new version.
   * Session organization only — never accept org id from body.
   */
  app.put(
    "/api/v1/knowledge/provider/company-config",
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
        const parsed = putBodySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          res.status(400).json({
            error: {
              code: "INVALID_INPUT",
              message: "Invalid company configuration payload.",
              details: parsed.error.flatten(),
            },
          });
          return;
        }
        const memberId = authed.fieldKit?.member?.id ?? null;
        const config = upsertProviderCompanyConfig(organizationId, parsed.data, {
          memberId: typeof memberId === "number" ? memberId : null,
        });
        res.json({
          organizationId,
          config,
          versions: listProviderCompanyConfigVersions(organizationId),
        });
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) {
          console.error("company-config PUT failed:", error);
        }
        res.status(status).json({
          error: {
            code: err.code ?? "COMPANY_CONFIG_WRITE_FAILED",
            message:
              status < 500
                ? err.message
                : "Could not save provider company configuration.",
          },
        });
      }
    },
  );

  /**
   * AI context package for authorized members of this organization only.
   * Explicitly labels all content as PROVIDER-SOURCED.
   */
  app.get(
    "/api/v1/knowledge/provider/company-config/ai-context",
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
        // Optional query orgId must match session (defense against client spoof).
        const requested =
          typeof req.query.organizationId === "string"
            ? Number(req.query.organizationId)
            : null;
        const orgId = assertProviderOrgAccess(
          organizationId,
          Number.isFinite(requested) ? requested : null,
        );
        const pack = buildProviderAiContext(orgId);
        if (!pack) {
          res.status(404).json({
            error: {
              code: "NO_COMPANY_CONFIG",
              message:
                "No provider company configuration has been published for your organization yet.",
            },
          });
          return;
        }
        res.json(pack);
      } catch (error) {
        const err = error as Error & { code?: string; status?: number };
        const status =
          typeof err.status === "number" && err.status >= 400 && err.status < 600
            ? err.status
            : 500;
        if (status >= 500) {
          console.error("company-config ai-context failed:", error);
        }
        res.status(status).json({
          error: {
            code: err.code ?? "COMPANY_CONFIG_AI_CONTEXT_FAILED",
            message:
              status < 500
                ? err.message
                : "Could not build provider AI context.",
          },
        });
      }
    },
  );
}
