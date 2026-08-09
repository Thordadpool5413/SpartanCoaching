import { describe, expect, it } from "vitest";
import {
  HSP_DOMAIN_OBJECTS,
  assertNoForbiddenParallelTable,
  forbiddenParallelTableObjects,
  getDomainObject,
  notModeledDomainObjects,
  tenantKeyFor,
  workflowEntityDomainObjects,
} from "./domain-map";
import {
  memberIdToWorkflowUuid,
  organizationIdToWorkflowUuid,
  workflowIdentityFromMember,
} from "./index";

describe("HSP domain map inventory", () => {
  it("has unique domain object ids", () => {
    const ids = HSP_DOMAIN_OBJECTS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(20);
  });

  it("covers required product concepts", () => {
    for (const id of [
      "organization",
      "user",
      "account",
      "contact",
      "next_action",
      "plan",
      "sales_call",
      "coaching",
      "tool_result",
      "entitlement",
      "audit_history",
    ] as const) {
      expect(getDomainObject(id)?.id).toBe(id);
    }
  });

  it("forbids parallel tables for workflow CRM core", () => {
    const forbidden = new Set(
      forbiddenParallelTableObjects().map((o) => o.id),
    );
    for (const id of [
      "account",
      "contact",
      "sales_call",
      "plan",
      "next_action",
      "coaching",
      "organization",
      "user",
    ] as const) {
      expect(forbidden.has(id)).toBe(true);
    }
  });

  it("workflow entities use UUID tenant key", () => {
    for (const o of workflowEntityDomainObjects()) {
      expect(o.tenantKey).toBe("organization_id_uuid");
      expect(o.location).toMatch(/sales_workflow/);
    }
  });

  it("auth objects use integer tenant key", () => {
    expect(tenantKeyFor("organization")).toBe("organization_id_int");
    expect(tenantKeyFor("user")).toBe("organization_id_int");
    expect(getDomainObject("user")?.location).toBe("client_members");
  });

  it("lists not_modeled candidates without pretending they are tables", () => {
    const missing = notModeledDomainObjects().map((o) => o.id);
    expect(missing).toEqual(
      expect.arrayContaining(["branch", "team", "relationship_stage", "goal"]),
    );
  });

  it("blocks forbidden parallel table names", () => {
    expect(() => assertNoForbiddenParallelTable("accounts")).toThrow(
      /Forbidden parallel table/,
    );
    expect(() => assertNoForbiddenParallelTable("contacts")).toThrow();
    expect(() => assertNoForbiddenParallelTable("user_preferences")).not.toThrow();
  });
});

describe("domain map + tenant-id adapter coherence", () => {
  it("identity mapping remains the only org/member bridge", () => {
    const id = workflowIdentityFromMember({
      memberId: 3,
      organizationId: 9,
    });
    expect(id.organizationId).toBe(organizationIdToWorkflowUuid(9));
    expect(id.userId).toBe(memberIdToWorkflowUuid(3));
    // Domain map points workflow account isolation at UUID style
    expect(tenantKeyFor("account")).toBe("organization_id_uuid");
    expect(tenantKeyFor("organization")).toBe("organization_id_int");
  });
});
