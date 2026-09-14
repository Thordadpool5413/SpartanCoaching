import type { Express } from "express";
import { z } from "zod/v4";
import { requireAdmin } from "../auth/middleware";
import { ANALYTICS_RETENTION_DAYS } from "../analytics/retention";
import {
  disabledFieldWorkHealth,
  fieldWorkHealthResponseSchema,
  isFieldWorkHealthEnabled,
} from "../analytics/fieldWorkHealth";
import { storage } from "../storage";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(ANALYTICS_RETENTION_DAYS).default(30),
  organizationId: z.union([
    z.literal("all"),
    z.coerce.number().int().positive(),
  ]).default("all"),
}).strict();

/**
 * Admin-only, aggregate field-work health. The response deliberately contains
 * no event metadata, member identifiers, organization names, or free text.
 */
export function registerAnalyticsRoutes(app: Express): void {
  app.get("/api/admin/analytics/field-work-health", requireAdmin, async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid field-work health filter." });
    }

    const organizationId =
      parsed.data.organizationId === "all" ? null : parsed.data.organizationId;
    const tenantScope = {
      type: organizationId == null ? "all" as const : "organization" as const,
      organizationId,
    };

    try {
      if (!isFieldWorkHealthEnabled()) {
        return res.json(disabledFieldWorkHealth(tenantScope, ANALYTICS_RETENTION_DAYS));
      }

      const health = await storage.getFieldWorkHealth({
        organizationId,
        days: parsed.data.days,
        retentionDays: ANALYTICS_RETENTION_DAYS,
      });
      return res.json(fieldWorkHealthResponseSchema.parse(health));
    } catch (error) {
      console.error("Get field-work health error:", error);
      return res.status(500).json({ error: "Field-work health is temporarily unavailable." });
    }
  });
}