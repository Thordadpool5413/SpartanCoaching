import { describe, it, expect } from "vitest";
import {
  PROVIDER_RESOURCE_LIBRARY_VERSION,
  PROVIDER_OWNERSHIP_LABEL,
  CORE_OWNERSHIP_LABEL,
  assertProviderResourceOrgAccess,
  canManageProviderLibrary,
  canViewProviderResource,
  matchesSearch,
  normalizeKind,
  normalizeStatus,
  presentCoreResourceLabel,
  presentProviderResource,
  sanitizeFileUrl,
  allowedTransitions,
} from "./providerResourceLibrary";

const row = {
  id: 1,
  organizationId: 10,
  title: "SNF Escalation Guide",
  description: "Internal escalation path",
  fileUrl: "/objects/provider/10/escalation.pdf",
  kind: "escalation_guide",
  status: "published",
  ownership: "provider",
  meta: { tags: ["snf", "escalation"] },
  createdByMemberId: 2,
  updatedByMemberId: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
  archivedAt: null,
  deletedAt: null,
};

describe("providerResourceLibrary (HSP-28)", () => {
  it("is versioned and labels ownership clearly", () => {
    expect(PROVIDER_RESOURCE_LIBRARY_VERSION).toMatch(
      /^provider-resource-library-v\d+/,
    );
    const p = presentProviderResource(row);
    expect(p.ownership).toBe("provider");
    expect(p.ownershipLabel).toBe(PROVIDER_OWNERSHIP_LABEL);
    expect(p.isProviderOwned).toBe(true);
    expect(p.isCore).toBe(false);

    const core = presentCoreResourceLabel({
      id: 9,
      title: "Core Script",
      fileUrl: "/resources/files/x.pdf",
    });
    expect(core.ownership).toBe("core");
    expect(core.ownershipLabel).toBe(CORE_OWNERSHIP_LABEL);
    expect(core.isProviderOwned).toBe(false);
    expect(core.isCore).toBe(true);
  });

  it("enforces tenant isolation on access checks", () => {
    expect(assertProviderResourceOrgAccess(10, 10).ok).toBe(true);
    const denied = assertProviderResourceOrgAccess(10, 99);
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.code).toBe("TENANT_ISOLATION");
  });

  it("limits member visibility to published (admins see drafts)", () => {
    expect(canViewProviderResource("published", false)).toBe(true);
    expect(canViewProviderResource("draft", false)).toBe(false);
    expect(canViewProviderResource("draft", true)).toBe(true);
    expect(canViewProviderResource("deleted", true)).toBe(false);
    expect(canManageProviderLibrary(false)).toBe(false);
    expect(canManageProviderLibrary(true)).toBe(true);
  });

  it("sanitizes file URLs and normalizes kind/status", () => {
    expect(sanitizeFileUrl("https://cdn.example.com/a.pdf")).toMatch(/^https:/);
    expect(sanitizeFileUrl("/objects/x")).toBe("/objects/x");
    expect(sanitizeFileUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeKind("coverage_map")).toBe("coverage_map");
    expect(normalizeKind("nope")).toBe("other");
    expect(normalizeStatus("in_review")).toBe("in_review");
  });

  it("supports search across title/kind/tags", () => {
    expect(matchesSearch(row, "escalation")).toBe(true);
    expect(matchesSearch(row, "snf")).toBe(true);
    expect(matchesSearch(row, "brand")).toBe(false);
  });

  it("defines review/publish/archive/delete transitions", () => {
    expect(allowedTransitions("draft")).toContain("published");
    expect(allowedTransitions("published")).toContain("archived");
    expect(allowedTransitions("archived")).toContain("deleted");
    expect(allowedTransitions("deleted")).toHaveLength(0);
  });
});
