import { describe, expect, it, beforeEach } from "vitest";
import {
  clearProviderKnowledgeRegistry,
  citationsFromThreeLayer,
  detectKnowledgeConflicts,
  filterProviderDocsForOrg,
  retrieveThreeLayerKnowledge,
  setProviderKnowledgeForOrg,
  type LayeredKnowledgeHit,
  type ProviderKnowledgeDoc,
} from "./threeLayerKnowledge";

const ORG_A = 10;
const ORG_B = 20;

const providerA: ProviderKnowledgeDoc[] = [
  {
    id: "svc-home",
    organizationId: ORG_A,
    title: "24/7 after-hours RN line",
    kind: "service",
    body: "Our hospice offers a dedicated after-hours RN line for referral sources in the north territory.",
    tags: ["service", "after-hours", "rn"],
    claimStrength: "operational",
  },
  {
    id: "claim-best",
    organizationId: ORG_A,
    title: "Best eligibility outcomes",
    kind: "claim",
    body: "We guarantee hospice eligibility for every referred patient and never involve physician judgment on prognosis or six-month criteria.",
    tags: ["eligibility", "claim", "guarantee", "patient", "prognosis"],
    claimStrength: "marketing",
  },
];

const providerB: ProviderKnowledgeDoc[] = [
  {
    id: "svc-b",
    organizationId: ORG_B,
    title: "Secret competitor service",
    kind: "service",
    body: "Org B exclusive inpatient unit capacity for complex cases.",
    tags: ["inpatient", "service"],
  },
];

beforeEach(() => {
  clearProviderKnowledgeRegistry();
  setProviderKnowledgeForOrg(ORG_A, providerA);
  setProviderKnowledgeForOrg(ORG_B, providerB);
});

describe("tenant isolation", () => {
  it("never returns another organization's provider knowledge", () => {
    const result = retrieveThreeLayerKnowledge({
      query: "after-hours RN inpatient",
      organizationId: ORG_A,
      maxProvider: 10,
    });
    const providerHits = result.hits.filter((h) => h.layer === "provider");
    expect(providerHits.every((h) => h.organizationId === ORG_A)).toBe(true);
    expect(providerHits.some((h) => h.id === "svc-b")).toBe(false);
    expect(providerHits.some((h) => h.title.includes("competitor"))).toBe(
      false,
    );
  });

  it("filterProviderDocsForOrg strips foreign org docs from mixed input", () => {
    const mixed = [...providerA, ...providerB];
    const filtered = filterProviderDocsForOrg(mixed, ORG_A);
    expect(filtered.every((d) => d.organizationId === ORG_A)).toBe(true);
    expect(filtered.some((d) => d.id === "svc-b")).toBe(false);
  });
});

describe("retrieveThreeLayerKnowledge", () => {
  it("returns core layer hits with visible source labels", () => {
    const result = retrieveThreeLayerKnowledge({
      query: "discipline empathy strategy method",
      organizationId: ORG_A,
    });
    const core = result.hits.filter((h) => h.layer === "core");
    expect(core.length).toBeGreaterThan(0);
    expect(core[0].layerLabel).toBe("Hospice Sales Pro Core");
    expect(result.layersPresent).toContain("core");
    expect(result.promptBlocks.some((b) => b.layer === "core")).toBe(true);
  });

  it("includes user context as lowest-authority layer", () => {
    const result = retrieveThreeLayerKnowledge({
      query: "follow up",
      organizationId: ORG_A,
      userContext: {
        territoryHint: "North",
        accountName: "Sunrise SNF",
        currentObjective: "Education visit",
      },
    });
    const user = result.hits.find((h) => h.layer === "user_context");
    expect(user).toBeTruthy();
    expect(user!.precedenceRank).toBeGreaterThan(
      result.hits.find((h) => h.layer === "core")?.precedenceRank ?? 0,
    );
    expect(user!.body).toContain("Sunrise SNF");
  });

  it("orders hits by precedence then score", () => {
    const result = retrieveThreeLayerKnowledge({
      query: "eligibility after-hours",
      organizationId: ORG_A,
      userContext: { accountName: "X" },
    });
    for (let i = 1; i < result.hits.length; i++) {
      expect(result.hits[i].precedenceRank).toBeGreaterThanOrEqual(
        result.hits[i - 1].precedenceRank,
      );
    }
  });
});

describe("conflicts", () => {
  it("prefers core over provider marketing on eligibility/ethics overlap", () => {
    const result = retrieveThreeLayerKnowledge({
      query: "eligibility six-month prognosis patient physician",
      organizationId: ORG_A,
      maxCore: 5,
      maxProvider: 5,
    });
    // Force conflict detection path with constructed hits if retrieval sparse
    const coreHits: LayeredKnowledgeHit[] = [
      {
        id: "eligibility-six-month",
        title: "Six-month prognosis framing",
        body: "Hospice eligibility is grounded in a physician-certified life expectancy of six months. Sales never override clinical judgment.",
        layer: "core",
        layerLabel: "Hospice Sales Pro Core",
        categoryOrKind: "eligibility",
        score: 10,
        organizationId: null,
        precedenceRank: 0,
        tags: ["eligibility", "prognosis"],
      },
    ];
    const providerHits: LayeredKnowledgeHit[] = [
      {
        id: "claim-best",
        title: "Best eligibility outcomes",
        body: providerA[1].body,
        layer: "provider",
        layerLabel: "Provider Knowledge",
        categoryOrKind: "claim",
        score: 8,
        organizationId: ORG_A,
        precedenceRank: 6,
        tags: ["eligibility"],
      },
    ];
    const conflicts = detectKnowledgeConflicts(
      coreHits,
      providerHits,
      providerA,
    );
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].resolution).toBe("prefer_core");
    expect(conflicts[0].guidance.toLowerCase()).toMatch(/core|prefer/);

    // Result path also surfaces composition notes
    expect(result.compositionNotes.length).toBeGreaterThan(0);
  });
});

describe("citationsFromThreeLayer", () => {
  it("exposes layer on every citation and omits raw user context body as authority", () => {
    const result = retrieveThreeLayerKnowledge({
      query: "method discipline",
      organizationId: ORG_A,
      userContext: { accountName: "A" },
    });
    const cites = citationsFromThreeLayer(result);
    expect(cites.every((c) => c.layer && c.layerLabel)).toBe(true);
    expect(cites.every((c) => c.layer !== "user_context")).toBe(true);
  });
});
