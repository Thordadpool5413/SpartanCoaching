import { describe, it, expect } from "vitest";
import {
  UNIVERSAL_SEARCH_VERSION,
  sanitizeSearchText,
  canSeeDocument,
  runUniversalSearch,
  documentsFromTools,
  documentsFromIntents,
  type SearchDocument,
  type SearchPermissions,
} from "./universalSearch";

const basePerms: SearchPermissions = {
  authenticated: true,
  canUseFieldKit: true,
  organizationId: 10,
  memberId: 5,
  role: "member",
};

function doc(partial: Partial<SearchDocument> & Pick<SearchDocument, "id" | "type" | "title">): SearchDocument {
  return {
    snippet: partial.snippet ?? partial.title,
    href: partial.href ?? "/x",
    tags: partial.tags ?? [],
    ...partial,
  };
}

describe("universal search (HSP-36)", () => {
  it("is versioned", () => {
    expect(UNIVERSAL_SEARCH_VERSION).toMatch(/^universal-search-v\d+/);
  });

  it("sanitizes SSN-like and email patterns from snippets", () => {
    const s = sanitizeSearchText("Call 123-45-6789 or a@b.com about patient John Smith");
    expect(s).toContain("[redacted]");
    expect(s).not.toMatch(/123-45-6789/);
    expect(s).not.toMatch(/a@b\.com/);
  });

  it("enforces tenant isolation for org-scoped docs", () => {
    const privateDoc = doc({
      id: "pr:1",
      type: "provider_resource",
      title: "Internal referral map",
      organizationId: 10,
      requiresFieldKit: true,
    });
    expect(canSeeDocument(privateDoc, basePerms)).toBe(true);
    expect(
      canSeeDocument(privateDoc, { ...basePerms, organizationId: 99 }),
    ).toBe(false);
    expect(
      canSeeDocument(privateDoc, {
        authenticated: false,
        canUseFieldKit: false,
      }),
    ).toBe(false);
  });

  it("hides other members' saved work", () => {
    const mine = doc({
      id: "sw:1",
      type: "saved_work",
      title: "My weekly plan draft",
      memberId: 5,
      organizationId: 10,
      requiresFieldKit: true,
    });
    expect(canSeeDocument(mine, basePerms)).toBe(true);
    expect(canSeeDocument(mine, { ...basePerms, memberId: 7 })).toBe(false);
  });

  it("excludes deleted and unavailable", () => {
    expect(
      canSeeDocument(doc({ id: "1", type: "resource", title: "X", deleted: true }), basePerms),
    ).toBe(false);
    expect(
      canSeeDocument(
        doc({ id: "2", type: "resource", title: "Y", unavailable: true }),
        basePerms,
      ),
    ).toBe(false);
  });

  it("requires Field Kit for gated tools", () => {
    const tool = doc({
      id: "tool:objections",
      type: "tool",
      title: "Objection Handler",
      tags: ["objection"],
      requiresFieldKit: true,
      requiresAuth: true,
    });
    expect(canSeeDocument(tool, { ...basePerms, canUseFieldKit: false })).toBe(
      false,
    );
  });

  it("ranks intent-style queries beyond exact title match", () => {
    const documents: SearchDocument[] = [
      doc({
        id: "tool:objections",
        type: "tool",
        title: "Objection Handler",
        snippet: "Field-ready responses",
        tags: ["Practice", "objection"],
        keywords: ["pushback", "not ready"],
        href: "/tools/objections",
        requiresFieldKit: true,
        requiresAuth: true,
      }),
      doc({
        id: "tool:branch",
        type: "tool",
        title: "Branch Profitability",
        snippet: "ADC math",
        tags: ["Measure"],
        href: "/tools/branch-profitability",
        requiresFieldKit: true,
        requiresAuth: true,
      }),
      doc({
        id: "knowledge:obj",
        type: "knowledge",
        title: "Objection: family not ready",
        snippet: "Acknowledge emotion and educate",
        tags: ["objection", "family"],
        href: "/portal/learn",
        requiresFieldKit: true,
      }),
      doc({
        id: "res:cards",
        type: "resource",
        title: "Objection cards",
        snippet: "Printable cards",
        tags: ["objection"],
        href: "/resources/objection-cards",
      }),
    ];

    const result = runUniversalSearch(documents, "not ready pushback", basePerms);
    expect(result.total).toBeGreaterThan(0);
    const types = new Set(result.groups.flatMap((g) => g.hits.map((h) => h.type)));
    expect(types.has("tool") || types.has("knowledge") || types.has("resource")).toBe(
      true,
    );
    // Branch calculator should not dominate an objection query
    const topIds = result.groups.flatMap((g) => g.hits).map((h) => h.id);
    expect(topIds[0]).not.toBe("tool:branch");
  });

  it("returns multiple content type groups when query matches several", () => {
    const documents: SearchDocument[] = [
      ...documentsFromTools([
        {
          id: "weekly-plan",
          title: "Weekly Plan Builder",
          description: "Monday–Friday territory plan",
          path: "/tools/weekly-plan-builder",
          category: "Plan",
          mobileToolTab: "weekly",
        },
      ]),
      doc({
        id: "res:territory",
        type: "resource",
        title: "Territory template",
        snippet: "Plan your territory",
        tags: ["territory", "plan"],
        href: "/resources/territory-template",
      }),
      doc({
        id: "art:1",
        type: "article",
        title: "Territory planning basics",
        snippet: "How to tier accounts",
        tags: ["territory"],
        href: "/articles/1",
      }),
    ];
    const result = runUniversalSearch(documents, "territory plan", basePerms);
    expect(result.groups.length).toBeGreaterThanOrEqual(2);
  });

  it("builds tool and intent documents with safe snippets", () => {
    const tools = documentsFromTools([
      {
        id: "email-templates",
        title: "Email Templates",
        description: "Follow-up emails without PHI",
        path: "/tools/email-templates",
      },
    ]);
    expect(tools[0]!.href).toBe("/tools/email-templates");
    expect(tools[0]!.requiresFieldKit).toBe(true);

    const intents = documentsFromIntents([
      {
        id: "handle_objection",
        title: "Handle an objection",
        description: "Turn pushback into education",
        destinations: [{ webPath: "/tools/objections" }],
      },
    ]);
    expect(intents[0]!.type).toBe("intent");
    expect(intents[0]!.href).toBe("/tools/objections");
  });
});
