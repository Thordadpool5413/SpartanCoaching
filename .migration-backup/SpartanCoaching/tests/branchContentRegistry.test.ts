/**
 * Branch Profitability Content Registry & Validator Tests
 *
 * Covers:
 *  - Claim registry completeness (all claims have required fields)
 *  - Claim classification rules
 *  - Content validator: payment_fact and regulatory_fact require source
 *  - Content validator: deprecated claims are blocked
 *  - Content presenter: known claim IDs return non-empty strings
 *  - Content presenter: unknown claim IDs throw
 *  - Governed claim classification accuracy
 *  - Content validator blocking unsupported fact claims
 */

import { describe, it, expect } from "vitest";
import {
  getClaim,
  getClaimText,
  getAllClaims,
  getClaimsFor,
  CONTENT_VERSION,
  type ContentClaim,
} from "../shared/branch_content_claim_registry";
import {
  validateClaim,
  validateAllClaims,
  assertClaimRenderable,
  isFactualClaim,
  requiresAssumptionLabel,
} from "../shared/branch_content_validator";
import {
  presentClaim,
  TOOLTIP_CONTENT,
  getGlossaryEntries,
  getRunwayDisclaimer,
  getStaffingModelNote,
  getHospiceTeamRegulatoryNote,
  getExportContentBlocks,
} from "../shared/branch_content_presenter";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNonEmpty(s: string): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Registry basics
// ─────────────────────────────────────────────────────────────────────────────

describe("content claim registry — basic structure", () => {
  it("CONTENT_VERSION is a non-empty semver-like string", () => {
    expect(CONTENT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("getAllClaims returns a non-empty array", () => {
    const claims = getAllClaims();
    expect(claims.length).toBeGreaterThan(0);
  });

  it("every claim has a non-empty claimId", () => {
    getAllClaims().forEach((c) => {
      expect(c.claimId).toBeTruthy();
    });
  });

  it("every claim has a non-empty claimText", () => {
    getAllClaims().forEach((c) => {
      expect(isNonEmpty(c.claimText)).toBe(true);
    });
  });

  it("every claim has a valid claimClass", () => {
    const validClasses = [
      "regulatory_fact",
      "payment_fact",
      "formula_rule",
      "model_assumption",
      "operating_example",
      "strategy_guidance",
      "opinion",
    ];
    getAllClaims().forEach((c) => {
      expect(validClasses).toContain(c.claimClass);
    });
  });

  it("every claim has a valid sourceType", () => {
    const validTypes = [
      "cms_regulation",
      "cms_payment_rule",
      "engine_formula",
      "model_design",
      "industry_survey",
      "coaching_guidance",
      "editorial",
    ];
    getAllClaims().forEach((c) => {
      expect(validTypes).toContain(c.sourceType);
    });
  });

  it("every claim has a valid confidenceLevel", () => {
    const validLevels = ["high", "medium", "low"];
    getAllClaims().forEach((c) => {
      expect(validLevels).toContain(c.confidenceLevel);
    });
  });

  it("every claim has a valid reviewStatus", () => {
    const validStatuses = ["current", "needs_review", "deprecated"];
    getAllClaims().forEach((c) => {
      expect(validStatuses).toContain(c.reviewStatus);
    });
  });

  it("every claim has a non-empty appliesTo array", () => {
    getAllClaims().forEach((c) => {
      expect(Array.isArray(c.appliesTo)).toBe(true);
      expect(c.appliesTo.length).toBeGreaterThan(0);
    });
  });

  it("claimId uniqueness — no two claims share an ID", () => {
    const claims = getAllClaims();
    const ids = claims.map((c) => c.claimId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Registry access
// ─────────────────────────────────────────────────────────────────────────────

describe("content claim registry — getClaim / getClaimText", () => {
  it("getClaim returns the correct claim for a known ID", () => {
    const c = getClaim("tip.targetADC");
    expect(c.claimId).toBe("tip.targetADC");
    expect(c.claimClass).toBe("formula_rule");
  });

  it("getClaim throws for an unknown ID", () => {
    expect(() => getClaim("does.not.exist")).toThrow(/Unknown claimId/);
  });

  it("getClaimText returns a non-empty string for known IDs", () => {
    expect(isNonEmpty(getClaimText("tip.rhcDay1"))).toBe(true);
    expect(isNonEmpty(getClaimText("glossary.breakEvenADC"))).toBe(true);
    expect(isNonEmpty(getClaimText("regulatory.hospiceTeamRequired"))).toBe(true);
  });

  it("getClaimsFor returns claims that include the given location", () => {
    const claims = getClaimsFor("input-rhc1-tooltip");
    expect(claims.length).toBeGreaterThan(0);
    claims.forEach((c) => {
      expect(c.appliesTo).toContain("input-rhc1-tooltip");
    });
  });

  it("getClaimsFor returns empty array for unknown location", () => {
    expect(getClaimsFor("nonexistent-location")).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Claim classification accuracy
// ─────────────────────────────────────────────────────────────────────────────

describe("claim classification accuracy", () => {
  it("tip.rhcDay1 is a payment_fact", () => {
    expect(getClaim("tip.rhcDay1").claimClass).toBe("payment_fact");
  });

  it("tip.rhcDay61 is a payment_fact", () => {
    expect(getClaim("tip.rhcDay61").claimClass).toBe("payment_fact");
  });

  it("regulatory.hospiceTeamRequired is a regulatory_fact", () => {
    expect(getClaim("regulatory.hospiceTeamRequired").claimClass).toBe("regulatory_fact");
  });

  it("tip.targetADC is a formula_rule", () => {
    expect(getClaim("tip.targetADC").claimClass).toBe("formula_rule");
  });

  it("tip.avgLOS is a formula_rule", () => {
    expect(getClaim("tip.avgLOS").claimClass).toBe("formula_rule");
  });

  it("tip.pharmacy is an operating_example (not payment_fact or regulatory_fact)", () => {
    const c = getClaim("tip.pharmacy");
    expect(c.claimClass).toBe("operating_example");
    expect(c.claimClass).not.toBe("payment_fact");
    expect(c.claimClass).not.toBe("regulatory_fact");
  });

  it("tip.dme is an operating_example", () => {
    expect(getClaim("tip.dme").claimClass).toBe("operating_example");
  });

  it("tip.supplies is an operating_example", () => {
    expect(getClaim("tip.supplies").claimClass).toBe("operating_example");
  });

  it("tip.targetMargin is a model_assumption", () => {
    expect(getClaim("tip.targetMargin").claimClass).toBe("model_assumption");
  });

  it("tip.startingCapital is a model_assumption", () => {
    expect(getClaim("tip.startingCapital").claimClass).toBe("model_assumption");
  });

  it("assumption.runwayRamp is a model_assumption", () => {
    expect(getClaim("assumption.runwayRamp").claimClass).toBe("model_assumption");
  });

  it("assumption.staffingScaling is a model_assumption", () => {
    expect(getClaim("assumption.staffingScaling").claimClass).toBe("model_assumption");
  });

  it("glossary entries are all formula_rule", () => {
    const glossaryIds = [
      "glossary.annualProfit",
      "glossary.breakEvenADC",
      "glossary.targetMarginADC",
      "glossary.admissionsNeeded",
    ];
    for (const id of glossaryIds) {
      expect(getClaim(id).claimClass).toBe("formula_rule");
    }
  });

  it("operating margin glossary entry acknowledges it's a benchmark, not regulation", () => {
    const c = getClaim("glossary.operatingMargin");
    // Must be classified as formula_rule (describes a formula) not regulatory_fact
    expect(c.claimClass).toBe("formula_rule");
    // But it must requiresDisclaimer because it contains a benchmark range
    expect(c.requiresDisclaimer).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Content validator
// ─────────────────────────────────────────────────────────────────────────────

describe("content validator — claim validation", () => {
  it("validateAllClaims returns valid=true for the shipped registry", () => {
    const result = validateAllClaims();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validateClaim returns no errors for payment_fact claims with source", () => {
    const c = getClaim("tip.rhcDay1");
    expect(validateClaim(c)).toHaveLength(0);
  });

  it("validateClaim returns no errors for regulatory_fact claims with source", () => {
    const c = getClaim("regulatory.hospiceTeamRequired");
    expect(validateClaim(c)).toHaveLength(0);
  });

  it("validateClaim blocks a payment_fact missing sourceUrl", () => {
    const badClaim: ContentClaim = {
      claimId: "test.bad.payment",
      claimText: "Some rate claim",
      claimClass: "payment_fact",
      sourceType: "cms_payment_rule",
      sourceTitle: "CMS",
      sourceUrl: "",        // ← missing
      lastVerifiedDate: "2025-01-01",
      appliesTo: ["test"],
      confidenceLevel: "high",
      reviewStatus: "current",
      requiresDisclaimer: false,
    };
    const errors = validateClaim(badClaim);
    expect(errors.some((e) => e.rule === "source_url_required")).toBe(true);
  });

  it("validateClaim blocks a payment_fact missing lastVerifiedDate", () => {
    const badClaim: ContentClaim = {
      claimId: "test.bad.date",
      claimText: "Some rate claim",
      claimClass: "payment_fact",
      sourceType: "cms_payment_rule",
      sourceTitle: "CMS",
      sourceUrl: "https://www.cms.gov",
      lastVerifiedDate: "",   // ← missing
      appliesTo: ["test"],
      confidenceLevel: "high",
      reviewStatus: "current",
      requiresDisclaimer: false,
    };
    const errors = validateClaim(badClaim);
    expect(errors.some((e) => e.rule === "verified_date_required")).toBe(true);
  });

  it("validateClaim blocks a deprecated claim", () => {
    const deprecatedClaim: ContentClaim = {
      claimId: "test.deprecated",
      claimText: "Old claim",
      claimClass: "formula_rule",
      sourceType: "engine_formula",
      sourceTitle: "Old engine",
      sourceUrl: "",
      lastVerifiedDate: "",
      appliesTo: ["test"],
      confidenceLevel: "low",
      reviewStatus: "deprecated",
      requiresDisclaimer: false,
    };
    const errors = validateClaim(deprecatedClaim);
    expect(errors.some((e) => e.rule === "no_deprecated_claims")).toBe(true);
  });

  it("assertClaimRenderable does not throw for valid claims", () => {
    expect(() => assertClaimRenderable("tip.targetADC")).not.toThrow();
    expect(() => assertClaimRenderable("tip.rhcDay1")).not.toThrow();
    expect(() => assertClaimRenderable("regulatory.hospiceTeamRequired")).not.toThrow();
  });

  it("assertClaimRenderable throws for unknown claimId", () => {
    expect(() => assertClaimRenderable("unknown.claim.xyz")).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Content validator classification helpers
// ─────────────────────────────────────────────────────────────────────────────

describe("content validator — classification helpers", () => {
  it("isFactualClaim returns true for regulatory_fact", () => {
    expect(isFactualClaim(getClaim("regulatory.hospiceTeamRequired"))).toBe(true);
  });

  it("isFactualClaim returns true for payment_fact", () => {
    expect(isFactualClaim(getClaim("tip.rhcDay1"))).toBe(true);
  });

  it("isFactualClaim returns true for formula_rule", () => {
    expect(isFactualClaim(getClaim("glossary.annualProfit"))).toBe(true);
  });

  it("isFactualClaim returns false for model_assumption", () => {
    expect(isFactualClaim(getClaim("tip.targetMargin"))).toBe(false);
  });

  it("isFactualClaim returns false for operating_example", () => {
    expect(isFactualClaim(getClaim("tip.pharmacy"))).toBe(false);
  });

  it("requiresAssumptionLabel returns true for claims marked as such", () => {
    expect(requiresAssumptionLabel(getClaim("tip.targetMargin"))).toBe(true);
    expect(requiresAssumptionLabel(getClaim("tip.startingCapital"))).toBe(true);
    expect(requiresAssumptionLabel(getClaim("assumption.runwayRamp"))).toBe(true);
  });

  it("requiresAssumptionLabel returns false for pure formula_rule claims", () => {
    expect(requiresAssumptionLabel(getClaim("glossary.annualProfit"))).toBe(false);
    expect(requiresAssumptionLabel(getClaim("glossary.breakEvenADC"))).toBe(false);
    expect(requiresAssumptionLabel(getClaim("tip.targetADC"))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Content presenter
// ─────────────────────────────────────────────────────────────────────────────

describe("content presenter — presentClaim", () => {
  it("returns non-empty strings for all known claim IDs", () => {
    const claims = getAllClaims();
    for (const c of claims) {
      expect(isNonEmpty(presentClaim(c.claimId))).toBe(true);
    }
  });

  it("throws for unknown claimId", () => {
    expect(() => presentClaim("unknown.id.xyz")).toThrow();
  });
});

describe("content presenter — TOOLTIP_CONTENT", () => {
  it("all tooltip functions return non-empty strings", () => {
    const keys = Object.keys(TOOLTIP_CONTENT) as (keyof typeof TOOLTIP_CONTENT)[];
    for (const key of keys) {
      const text = TOOLTIP_CONTENT[key]();
      expect(isNonEmpty(text)).toBe(true);
    }
  });

  it("TOOLTIP_CONTENT covers all required BranchInput fields", () => {
    const expected = [
      "targetADC",
      "avgLengthOfStayDays",
      "targetOperatingMarginPercent",
      "rhcDay1To60",
      "rhcDay61Plus",
      "pharmacyPerDay",
      "dmePerDay",
      "suppliesPerDay",
      "travelPerDay",
      "otherPerDay",
      "monthlyNonPayrollOverhead",
      "startingCapital",
      "admissionsPerMarketerPerMonth",
    ];
    for (const key of expected) {
      expect(TOOLTIP_CONTENT).toHaveProperty(key);
    }
  });

  it("RHC Day 1 tooltip contains reference to CMS or Medicare", () => {
    const text = TOOLTIP_CONTENT.rhcDay1To60();
    expect(text.toLowerCase()).toMatch(/medicare|cms/);
  });

  it("RHC Day 61 tooltip mentions the rate reduction", () => {
    const text = TOOLTIP_CONTENT.rhcDay61Plus();
    expect(text).toMatch(/lower|reduc/i);
  });
});

describe("content presenter — getGlossaryEntries", () => {
  it("returns 6 entries", () => {
    const entries = getGlossaryEntries();
    expect(entries).toHaveLength(6);
  });

  it("every entry has a non-empty term and def", () => {
    const entries = getGlossaryEntries();
    for (const e of entries) {
      expect(isNonEmpty(e.term)).toBe(true);
      expect(isNonEmpty(e.def)).toBe(true);
    }
  });

  it("entry terms match expected glossary keys", () => {
    const entries = getGlossaryEntries();
    const terms = entries.map((e) => e.term);
    expect(terms).toContain("Annual Profit");
    expect(terms).toContain("Operating Margin");
    expect(terms).toContain("Break-Even ADC");
    expect(terms).toContain("Target Margin ADC");
    expect(terms).toContain("Cash Runway");
    expect(terms).toContain("Admissions Needed");
  });

  it("Operating Margin entry has requiresDisclaimer=true", () => {
    const entries = getGlossaryEntries();
    const om = entries.find((e) => e.term === "Operating Margin");
    expect(om?.requiresDisclaimer).toBe(true);
  });

  it("Annual Profit entry has requiresDisclaimer=false", () => {
    const entries = getGlossaryEntries();
    const ap = entries.find((e) => e.term === "Annual Profit");
    expect(ap?.requiresDisclaimer).toBe(false);
  });

  it("Cash Runway entry mentions it is a planning model or assumption", () => {
    const entries = getGlossaryEntries();
    const cr = entries.find((e) => e.term === "Cash Runway");
    expect(cr?.def.toLowerCase()).toMatch(/plan|model|assumption/);
  });
});

describe("content presenter — special content functions", () => {
  it("getRunwayDisclaimer returns a non-empty string", () => {
    expect(isNonEmpty(getRunwayDisclaimer())).toBe(true);
  });

  it("getStaffingModelNote returns a non-empty string", () => {
    expect(isNonEmpty(getStaffingModelNote())).toBe(true);
  });

  it("getHospiceTeamRegulatoryNote returns a non-empty string", () => {
    expect(isNonEmpty(getHospiceTeamRegulatoryNote())).toBe(true);
  });

  it("getExportContentBlocks returns at least 1 block", () => {
    const blocks = getExportContentBlocks();
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("every export content block has non-empty sectionTitle and body", () => {
    const blocks = getExportContentBlocks();
    for (const block of blocks) {
      expect(isNonEmpty(block.sectionTitle)).toBe(true);
      expect(isNonEmpty(block.body)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — Governed claim correctness (accuracy spot checks)
// ─────────────────────────────────────────────────────────────────────────────

describe("governed claim correctness", () => {
  it("RHC Day 1 claim mentions $230.83 (FY 2026 national base rate)", () => {
    const text = getClaimText("tip.rhcDay1");
    expect(text).toContain("230.83");
  });

  it("RHC Day 61 claim mentions $181.94 (FY 2026 national base rate)", () => {
    const text = getClaimText("tip.rhcDay61");
    expect(text).toContain("181.94");
  });

  it("RHC Day 1 claim references FY 2026", () => {
    const text = getClaimText("tip.rhcDay1");
    expect(text).toContain("2026");
  });

  it("RHC Day 61 claim references FY 2026", () => {
    const text = getClaimText("tip.rhcDay61");
    expect(text).toContain("2026");
  });

  it("RHC Day 1 claim states national base rate before wage index adjustment", () => {
    const text = getClaimText("tip.rhcDay1");
    expect(text).toMatch(/national base rate/i);
  });

  it("RHC Day 61 claim states national base rate before wage index adjustment", () => {
    const text = getClaimText("tip.rhcDay61");
    expect(text).toMatch(/national base rate/i);
  });

  it("RHC Day 1 claim source is tagged FY2026", () => {
    const claim = getClaim("tip.rhcDay1");
    expect(claim.sourceTitle).toContain("FY2026");
    expect(claim.lastVerifiedDate).toMatch(/^2026/);
  });

  it("RHC Day 61 claim source is tagged FY2026", () => {
    const claim = getClaim("tip.rhcDay61");
    expect(claim.sourceTitle).toContain("FY2026");
    expect(claim.lastVerifiedDate).toMatch(/^2026/);
  });

  it("break-even glossary entry contains the formula", () => {
    const text = getClaimText("glossary.breakEvenADC");
    expect(text).toMatch(/fixed cost|formula/i);
  });

  it("target margin ADC glossary entry contains the formula", () => {
    const text = getClaimText("glossary.targetMarginADC");
    expect(text).toMatch(/formula|annual fixed cost/i);
  });

  it("admissions needed glossary entry references LOS", () => {
    const text = getClaimText("glossary.admissionsNeeded");
    expect(text).toMatch(/LOS|length of stay/i);
  });

  it("staffing scaling note mentions RN Case Manager ratio", () => {
    const text = getClaimText("assumption.staffingScaling");
    expect(text).toMatch(/RN Case Manager/i);
    expect(text).toMatch(/12/);  // 1 per 12 patients
  });

  it("staffing scaling note mentions Hospice Aide ratio", () => {
    const text = getClaimText("assumption.staffingScaling");
    expect(text).toMatch(/Hospice Aide/i);
    expect(text).toMatch(/8/);  // 1 per 8 patients
  });

  it("runway ramp assumption mentions 18 months or linear", () => {
    const text = getClaimText("assumption.runwayRamp");
    expect(text).toMatch(/18|linear/i);
  });

  it("FY 2026 payment update claim exists in registry", () => {
    const claim = getClaim("fact.fy2026PaymentUpdate");
    expect(claim).toBeDefined();
  });

  it("FY 2026 payment update claim is classified as payment_fact", () => {
    const claim = getClaim("fact.fy2026PaymentUpdate");
    expect(claim.claimClass).toBe("payment_fact");
  });

  it("FY 2026 payment update claim references 2.6%", () => {
    const text = getClaimText("fact.fy2026PaymentUpdate");
    expect(text).toMatch(/2\.6/);
  });

  it("FY 2026 payment update claim has sourceUrl", () => {
    const claim = getClaim("fact.fy2026PaymentUpdate");
    expect(claim.sourceUrl).toBeTruthy();
  });

  it("FY 2026 payment update claim has lastVerifiedDate", () => {
    const claim = getClaim("fact.fy2026PaymentUpdate");
    expect(claim.lastVerifiedDate).toBeTruthy();
  });

  it("FY 2026 payment update claim passes validator (no errors)", () => {
    const claim = getClaim("fact.fy2026PaymentUpdate");
    const errors = validateClaim(claim);
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — Engine result object has validation and contentVersion
// ─────────────────────────────────────────────────────────────────────────────

describe("engine result object — validation and content version fields", () => {
  it("runEngine result has validation field with mathValid, contentValid, errors", async () => {
    const { runEngine } = await import("../shared/branchProfitabilityEngine");
    const { DEFAULT_INPUTS, STAFF_ROLES } = await import("../shared/branchPresetConfigs");
    const { CONTENT_VERSION } = await import("../shared/branch_content_claim_registry");

    const result = runEngine(DEFAULT_INPUTS, STAFF_ROLES, CONTENT_VERSION);

    expect(result.validation).toBeDefined();
    expect(typeof result.validation.mathValid).toBe("boolean");
    expect(typeof result.validation.contentValid).toBe("boolean");
    expect(Array.isArray(result.validation.errors)).toBe(true);
    expect(result.validation.mathValid).toBe(true);
    expect(result.validation.contentValid).toBe(true);
    expect(result.validation.errors).toHaveLength(0);
  });

  it("runEngine result has metadata.contentVersion", async () => {
    const { runEngine } = await import("../shared/branchProfitabilityEngine");
    const { DEFAULT_INPUTS, STAFF_ROLES } = await import("../shared/branchPresetConfigs");
    const { CONTENT_VERSION } = await import("../shared/branch_content_claim_registry");

    const result = runEngine(DEFAULT_INPUTS, STAFF_ROLES, CONTENT_VERSION);

    expect(result.metadata.contentVersion).toBe(CONTENT_VERSION);
    expect(result.metadata.contentVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
