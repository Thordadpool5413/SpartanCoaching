import { describe, it, expect, beforeEach } from "vitest";
import {
  TRUSTED_AI_RESULT_VERSION,
  assembleTrustedAiResult,
  assembleFromObjectionResponse,
  assembleFromPlaybookResponse,
  assembleFromAdvancedAiExpose,
  authorityFromCitation,
  sourcesFromCitations,
  saveTrustedAiResult,
  listSavedTrustedAiResults,
  deleteSavedTrustedAiResult,
  clearTrustedAiResultStoreForTests,
} from "./trustedAiResult";

describe("trustedAiResult authority rules", () => {
  it("never upgrades bare CMS label to snapshot authority without ids", () => {
    expect(
      authorityFromCitation({ source: "CMS_MCD", title: "Some LCD" }),
    ).toBe("unknown");
  });

  it("assigns cms_policy_snapshot only when snapshot or document id exists", () => {
    expect(
      authorityFromCitation({
        snapshotId: "snap-1",
        documentId: "doc-1",
        source: "CMS_MCD",
      }),
    ).toBe("cms_policy_snapshot");
  });

  it("maps Spartan corpus categories to spartan_methodology", () => {
    expect(
      authorityFromCitation({
        id: "method-des",
        title: "Spartan Method triad",
        category: "method",
      }),
    ).toBe("spartan_methodology");
  });

  it("does not invent sources from empty citations", () => {
    expect(sourcesFromCitations([])).toEqual([]);
    expect(sourcesFromCitations(undefined)).toEqual([]);
  });
});

describe("assembleTrustedAiResult", () => {
  it("builds semantic sections and plainText for long answers", () => {
    const result = assembleTrustedAiResult({
      toolId: "objection",
      primaryText: "I hear that timing feels hard…",
      citations: [
        { id: "method-des", title: "Spartan Method triad", category: "method" },
      ],
      nextMove: "Schedule a short educational follow-up.",
    });

    expect(result.schemaVersion).toBe(TRUSTED_AI_RESULT_VERSION);
    expect(result.suggestedWording).toContain("timing");
    expect(result.recommendation).toBeTruthy();
    expect(result.professionalBoundary).toMatch(/PHI|identifiers/i);
    expect(result.sourceBasis).toHaveLength(1);
    expect(result.sourceBasis[0].authority).toBe("spartan_methodology");
    expect(result.spartanMethodologyBasis).toContain("Spartan Method triad");
    expect(result.plainText).toContain("Suggested wording");
    expect(result.plainText).toContain("Next move");
    expect(result.plainText).toContain("Professional boundary");
    expect(result.actions.canCopy).toBe(true);
    expect(result.actions.canSave).toBe(true);
    expect(result.trustNotice).toMatch(/Coaching aid/i);
  });

  it("labels model-only output instead of fabricating corpus sources", () => {
    const result = assembleTrustedAiResult({
      toolId: "playbooks",
      primaryText: "Step 1: prepare. Step 2: visit.",
    });
    expect(result.sourceBasis).toHaveLength(1);
    expect(result.sourceBasis[0].authority).toBe("model_generated");
    expect(result.sourceBasis[0].disclaimer).toMatch(/not a citable/i);
    expect(result.uncertainty).toMatch(/practice wording/i);
  });

  it("includes coverage snapshot only when real ids provided", () => {
    const withSnap = assembleTrustedAiResult({
      toolId: "medicare-lcd-advisor",
      primaryText: "Review LCD criteria with the physician.",
      coveragePolicy: {
        snapshotId: "s1",
        documentId: "LCD-123",
        version: "2",
        sourceUrl: "https://example.invalid/lcd",
      },
    });
    expect(withSnap.sourceBasis.some((s) => s.authority === "cms_policy_snapshot")).toBe(
      true,
    );

    const without = assembleTrustedAiResult({
      toolId: "medicare-lcd-advisor",
      primaryText: "Review LCD criteria with the physician.",
      coveragePolicy: { sourceUrl: "https://example.invalid/lcd" },
    });
    expect(
      without.sourceBasis.some((s) => s.authority === "cms_policy_snapshot"),
    ).toBe(false);
  });
});

describe("tool-specific assemblers", () => {
  it("assembleFromObjectionResponse preserves citations as methodology basis", () => {
    const r = assembleFromObjectionResponse({
      response: "I understand this feels early…",
      citations: [
        { id: "objection-not-ready", title: "Objection: family not ready", category: "objection" },
      ],
    });
    expect(r.toolId).toBe("objection");
    expect(r.relatedToolIds).toContain("roleplay");
    expect(r.sourceBasis[0].authority).toBe("spartan_methodology");
  });

  it("assembleFromPlaybookResponse does not invent sources", () => {
    const r = assembleFromPlaybookResponse({
      playbook: "## Prep\n- Call first",
      scenario: "SNF liaison visit",
    });
    expect(r.toolId).toBe("playbooks");
    expect(r.sourceBasis.every((s) => s.authority === "model_generated")).toBe(true);
  });

  it("assembleFromAdvancedAiExpose blocks clinical save by default", () => {
    const r = assembleFromAdvancedAiExpose({
      toolId: "medicare-lcd-advisor",
      output: { summary: "Educational criteria overview" },
      clinical: true,
    });
    expect(r.retention).toBe("clinical_ephemeral");
    expect(r.actions.canSave).toBe(false);
  });
});

describe("saved trusted results store (tenant isolation)", () => {
  beforeEach(() => {
    clearTrustedAiResultStoreForTests();
  });

  it("saves and lists only the owning member within an organization", () => {
    const result = assembleFromObjectionResponse({
      response: "Talk track A",
      citations: [],
    });
    const saved = saveTrustedAiResult({
      organizationId: 10,
      memberId: 1,
      title: "Not ready",
      result,
    });
    expect(saved.id).toMatch(/^tar_/);
    expect(saved.result.retention).toBe("member_saved");
    expect(saved.result.recoverable).toBe(true);

    // Other member same org
    expect(
      listSavedTrustedAiResults({ organizationId: 10, memberId: 2 }),
    ).toHaveLength(0);
    // Same member other org
    expect(
      listSavedTrustedAiResults({ organizationId: 99, memberId: 1 }),
    ).toHaveLength(0);
    expect(
      listSavedTrustedAiResults({ organizationId: 10, memberId: 1 }),
    ).toHaveLength(1);
  });

  it("refuses clinical ephemeral saves", () => {
    const clinical = assembleFromAdvancedAiExpose({
      toolId: "medicare-lcd-advisor",
      output: { summary: "x" },
      clinical: true,
    });
    expect(() =>
      saveTrustedAiResult({
        organizationId: 1,
        memberId: 1,
        title: "nope",
        result: clinical,
      }),
    ).toThrow(/Clinical ephemeral/);
  });

  it("deletes only matching tenant+member record", () => {
    const result = assembleFromObjectionResponse({ response: "x" });
    const a = saveTrustedAiResult({
      organizationId: 1,
      memberId: 1,
      title: "A",
      result,
    });
    saveTrustedAiResult({
      organizationId: 1,
      memberId: 2,
      title: "B",
      result,
    });
    expect(
      deleteSavedTrustedAiResult({
        organizationId: 1,
        memberId: 2,
        id: a.id,
      }),
    ).toBe(false);
    expect(
      deleteSavedTrustedAiResult({
        organizationId: 1,
        memberId: 1,
        id: a.id,
      }),
    ).toBe(true);
    expect(
      listSavedTrustedAiResults({ organizationId: 1, memberId: 1 }),
    ).toHaveLength(0);
  });
});
