import { describe, expect, it } from "vitest";
import {
  CRITICAL_ASSETS,
  INCIDENT_RESPONSE_STEPS,
  INCIDENT_SEVERITIES,
  RECOVERY_OBJECTIVES,
  SUPPORT_CATEGORIES,
  STATUS_TEMPLATES,
  buildOpsReadinessSnapshot,
} from "./ops-readiness";

describe("ops readiness catalog", () => {
  it("defines RPO/RTO for database and storage", () => {
    expect(RECOVERY_OBJECTIVES.databaseRpoMinutes).toBeLessThanOrEqual(24 * 60);
    expect(RECOVERY_OBJECTIVES.databaseRtoMinutes).toBeGreaterThan(0);
    expect(RECOVERY_OBJECTIVES.storageRpoMinutes).toBeGreaterThan(0);
  });

  it("lists critical assets including DB, storage, provider content, config, billing", () => {
    const cats = new Set(CRITICAL_ASSETS.map((a) => a.category));
    expect(cats.has("database")).toBe(true);
    expect(cats.has("storage")).toBe(true);
    expect(cats.has("provider_content")).toBe(true);
    expect(cats.has("config")).toBe(true);
    expect(cats.has("billing")).toBe(true);
    for (const a of CRITICAL_ASSETS) {
      expect(a.restoreProcedure.length).toBeGreaterThan(20);
      expect(a.retention.length).toBeGreaterThan(5);
    }
  });

  it("defines four severity levels with response times", () => {
    expect(INCIDENT_SEVERITIES.map((s) => s.level)).toEqual([
      "SEV1",
      "SEV2",
      "SEV3",
      "SEV4",
    ]);
    expect(INCIDENT_SEVERITIES[0]!.responseMinutes).toBeLessThan(
      INCIDENT_SEVERITIES[3]!.responseMinutes,
    );
  });

  it("covers billing, access, defect, trust support categories", () => {
    const ids = SUPPORT_CATEGORIES.map((c) => c.id);
    expect(ids).toContain("billing");
    expect(ids).toContain("account_access");
    expect(ids).toContain("product_defect");
    expect(ids).toContain("trust_privacy");
  });

  it("has status templates and ordered response steps", () => {
    expect(STATUS_TEMPLATES.investigating).toMatch(/investigating/i);
    expect(STATUS_TEMPLATES.resolved).toMatch(/resolved/i);
    expect(INCIDENT_RESPONSE_STEPS.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("buildOpsReadinessSnapshot is secret-free", () => {
    const snap = buildOpsReadinessSnapshot();
    const blob = JSON.stringify(snap);
    expect(blob).not.toMatch(/sk_live|Bearer |postgres:\/\//i);
    expect(blob).not.toMatch(/passwordHash|api[_-]?key\s*=/i);
    expect(snap.restoreDrill.command).toContain("backup-restore-drill");
  });
});
