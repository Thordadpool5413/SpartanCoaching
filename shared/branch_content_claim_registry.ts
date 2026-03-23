/**
 * Branch Profitability Governed Content Claim Registry
 *
 * Every user-facing educational statement (tooltips, glossary, help text) is
 * declared here with full provenance metadata before it may appear anywhere in
 * the UI, print view, PDF, or export.
 *
 * Rules:
 * 1. No component, print template, or PDF builder may contain a free-form
 *    factual claim outside this registry.
 * 2. Every claim has a claimClass that determines how it may be presented.
 * 3. A "regulatory_fact" or "payment_fact" requires a sourceUrl and a
 *    lastVerifiedDate and must not be presented if it cannot be verified.
 * 4. "model_assumption", "operating_example", "strategy_guidance", and
 *    "opinion" must never be presented as regulatory or payment facts.
 */

// ─── Claim classification ─────────────────────────────────────────────────────

export type ClaimClass =
  | "regulatory_fact"   // Verifiable CMS / federal rule
  | "payment_fact"      // Verifiable Medicare payment rate or rule
  | "formula_rule"      // Describes a formula used in the shared engine
  | "model_assumption"  // Assumption built into the simulator model
  | "operating_example" // Representative industry range / example value
  | "strategy_guidance" // Coaching recommendation
  | "opinion";          // Labeled opinion, not presented as fact

export type SourceType =
  | "cms_regulation"
  | "cms_payment_rule"
  | "engine_formula"
  | "model_design"
  | "industry_survey"
  | "coaching_guidance"
  | "editorial";

export type ConfidenceLevel = "high" | "medium" | "low";
export type ReviewStatus = "current" | "needs_review" | "deprecated";

// ─── Claim type ────────────────────────────────────────────────────────────────

export interface ContentClaim {
  claimId: string;
  claimText: string;
  claimClass: ClaimClass;
  sourceType: SourceType;
  sourceTitle: string;
  sourceUrl: string;      // empty string when not applicable
  lastVerifiedDate: string; // ISO 8601 date, empty when not applicable
  appliesTo: string[];    // screen locations where this claim appears
  confidenceLevel: ConfidenceLevel;
  reviewStatus: ReviewStatus;
  /** True when this claim must be labeled as an assumption or example in UI. */
  requiresDisclaimer: boolean;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const CLAIMS: ContentClaim[] = [
  // ── Tooltip: Target ADC ──────────────────────────────────────────────────
  {
    claimId: "tip.targetADC",
    claimText:
      "Average Daily Census — the number of patients actively on service at any given time. This is the primary driver of branch revenue: each additional patient adds their contribution margin to the pool that funds payroll and overhead.",
    claimClass: "formula_rule",
    sourceType: "engine_formula",
    sourceTitle: "Branch Profitability Engine — ADC definition",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["input-adc-tooltip"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── Tooltip: Average LOS ─────────────────────────────────────────────────
  {
    claimId: "tip.avgLOS",
    claimText:
      "Average number of days a patient remains on service before death or discharge. When LOS exceeds 60 days, a portion of revenue shifts to the lower Day 61+ rate. The engine blends both rates proportionally based on the LOS you enter.",
    claimClass: "formula_rule",
    sourceType: "engine_formula",
    sourceTitle: "Branch Profitability Engine — blended revenue formula",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["input-los-tooltip"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── Tooltip: Target Operating Margin ────────────────────────────────────
  {
    claimId: "tip.targetMargin",
    claimText:
      "Your goal for operating profit as a percentage of revenue. This drives the Target Margin ADC — the census where the model projects you hitting that goal. The 12–18% range shown in the glossary reflects a common hospice industry benchmark, not a regulatory requirement.",
    claimClass: "model_assumption",
    sourceType: "model_design",
    sourceTitle: "Branch Profitability Engine — target margin ADC formula",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["input-target-margin-tooltip"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: true,
  },

  // ── Tooltip: RHC Day 1–60 ───────────────────────────────────────────────
  {
    claimId: "tip.rhcDay1",
    claimText:
      "Medicare's Routine Home Care reimbursement rate for the first 60 days of each benefit period. The 2025 national base rate is $224.62 per day. Your actual contracted rate may vary by CBSA wage index. Enter your actual rate for accurate results.",
    claimClass: "payment_fact",
    sourceType: "cms_payment_rule",
    sourceTitle: "CMS Hospice Payment Rates FY2025",
    sourceUrl: "https://www.cms.gov/medicare/payment/hospice-payment",
    lastVerifiedDate: "2025-01-01",
    appliesTo: ["input-rhc1-tooltip"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── Tooltip: RHC Day 61+ ────────────────────────────────────────────────
  {
    claimId: "tip.rhcDay61",
    claimText:
      "Medicare's reduced RHC rate for days 61 and beyond in a benefit period. The 2025 national base rate is $177.27 per day — approximately 21% lower than the Day 1–60 rate. Patients with longer LOS generate more patient-days at this lower rate, which reduces blended revenue per day.",
    claimClass: "payment_fact",
    sourceType: "cms_payment_rule",
    sourceTitle: "CMS Hospice Payment Rates FY2025",
    sourceUrl: "https://www.cms.gov/medicare/payment/hospice-payment",
    lastVerifiedDate: "2025-01-01",
    appliesTo: ["input-rhc2-tooltip"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── Tooltip: Pharmacy ───────────────────────────────────────────────────
  {
    claimId: "tip.pharmacy",
    claimText:
      "Average daily drug cost per patient, covering all medications on the hospice plan of care. Typical range: $20–25/day for standard acuity. Oncology or complex pain management patients often reach $40–60/day. Enter your actual or projected average.",
    claimClass: "operating_example",
    sourceType: "industry_survey",
    sourceTitle: "Hospice variable cost operating ranges — industry composite",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["input-pharmacy-tooltip"],
    confidenceLevel: "medium",
    reviewStatus: "current",
    requiresDisclaimer: true,
  },

  // ── Tooltip: DME ────────────────────────────────────────────────────────
  {
    claimId: "tip.dme",
    claimText:
      "Durable Medical Equipment — daily allocated cost for hospital beds, wheelchairs, commodes, oxygen concentrators, and other home-based equipment. Typical range: $8–12/day per patient.",
    claimClass: "operating_example",
    sourceType: "industry_survey",
    sourceTitle: "Hospice variable cost operating ranges — industry composite",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["input-dme-tooltip"],
    confidenceLevel: "medium",
    reviewStatus: "current",
    requiresDisclaimer: true,
  },

  // ── Tooltip: Supplies ───────────────────────────────────────────────────
  {
    claimId: "tip.supplies",
    claimText:
      "Clinical supply cost per patient per day — gloves, dressings, wound care materials, incontinence products, and the clinical supply bag. Standard acuity: $8–12/day. Wound-heavy or oncology patients can reach $20–30/day.",
    claimClass: "operating_example",
    sourceType: "industry_survey",
    sourceTitle: "Hospice variable cost operating ranges — industry composite",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["input-supplies-tooltip"],
    confidenceLevel: "medium",
    reviewStatus: "current",
    requiresDisclaimer: true,
  },

  // ── Tooltip: Travel ──────────────────────────────────────────────────────
  {
    claimId: "tip.travel",
    claimText:
      "Average clinician mileage reimbursement and drive-time cost per patient per day. Varies significantly by geography and patient density. Rural territories typically carry higher per-patient travel costs than urban or suburban markets.",
    claimClass: "operating_example",
    sourceType: "industry_survey",
    sourceTitle: "Hospice variable cost operating ranges — industry composite",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["input-travel-tooltip"],
    confidenceLevel: "medium",
    reviewStatus: "current",
    requiresDisclaimer: true,
  },

  // ── Tooltip: Other ──────────────────────────────────────────────────────
  {
    claimId: "tip.other",
    claimText:
      "Any direct variable cost not captured above — contracted therapy services, lab draws, interpreter services, or other per-patient expenses that scale with census.",
    claimClass: "model_assumption",
    sourceType: "model_design",
    sourceTitle: "Branch Profitability Engine — variable cost inputs",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["input-other-tooltip"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── Tooltip: Monthly Non-Payroll Overhead ───────────────────────────────
  {
    claimId: "tip.overhead",
    claimText:
      "Fixed non-payroll monthly costs: office rent, EMR subscription, liability insurance, phone systems, and general & administrative expenses. This cost does not scale with census — it is incurred at the same level whether the branch has 10 or 100 patients.",
    claimClass: "formula_rule",
    sourceType: "engine_formula",
    sourceTitle: "Branch Profitability Engine — annual overhead formula",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["input-overhead-tooltip"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── Tooltip: Starting Capital ────────────────────────────────────────────
  {
    claimId: "tip.startingCapital",
    claimText:
      "Total cash available at launch to absorb negative cash flow while census ramps up. The Cash Runway simulation shows how many months this capital covers before the branch hits break-even ADC. This model uses an 18-month linear ramp from zero to target ADC.",
    claimClass: "model_assumption",
    sourceType: "model_design",
    sourceTitle: "Branch Profitability Engine — 18-month runway simulation",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["input-starting-capital-tooltip"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: true,
  },

  // ── Tooltip: Admissions per Marketer ────────────────────────────────────
  {
    claimId: "tip.admissionsPerMarketer",
    claimText:
      "New patient admissions each salesperson generates per month on average. This input drives the Marketers Needed calculation. Ranges vary widely by market and coaching support — enter your actual or projected number for your team.",
    claimClass: "model_assumption",
    sourceType: "model_design",
    sourceTitle: "Branch Profitability Engine — marketers needed formula",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["input-admissions-per-marketer-tooltip"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── HOW TO READ: Annual Profit ───────────────────────────────────────────
  {
    claimId: "glossary.annualProfit",
    claimText:
      "Net operating income after all payroll, variable costs, and overhead at your current ADC. Formula: Revenue − Variable Cost − Payroll − Overhead. A negative number means the branch is losing money every day at that census.",
    claimClass: "formula_rule",
    sourceType: "engine_formula",
    sourceTitle: "Branch Profitability Engine — annual profit formula",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["glossary-annual-profit"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── HOW TO READ: Operating Margin ───────────────────────────────────────
  {
    claimId: "glossary.operatingMargin",
    claimText:
      "Annual Profit ÷ Annual Revenue × 100. The 12–18% benchmark cited in the glossary reflects a common hospice industry operating range, not a regulatory standard. Your target margin is the value you enter in the inputs.",
    claimClass: "formula_rule",
    sourceType: "engine_formula",
    sourceTitle: "Branch Profitability Engine — operating margin formula",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["glossary-operating-margin"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: true,
  },

  // ── HOW TO READ: Break-Even ADC ─────────────────────────────────────────
  {
    claimId: "glossary.breakEvenADC",
    claimText:
      "The minimum census where total annual revenue exactly covers all fixed and variable costs. Formula: Annual Fixed Cost ÷ (Contribution Per Day × 365). Every patient below this number means the branch is losing money.",
    claimClass: "formula_rule",
    sourceType: "engine_formula",
    sourceTitle: "Branch Profitability Engine — break-even ADC formula",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["glossary-break-even-adc"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── HOW TO READ: Target Margin ADC ──────────────────────────────────────
  {
    claimId: "glossary.targetMarginADC",
    claimText:
      "The census required to hit your operating margin goal. Formula: Annual Fixed Cost ÷ (365 × ((Revenue/Day × (1 − Margin%)) − Variable Cost/Day)). This is the real sales target — not break-even. Build your sales plan around closing the gap to this number.",
    claimClass: "formula_rule",
    sourceType: "engine_formula",
    sourceTitle: "Branch Profitability Engine — target margin ADC formula",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["glossary-target-margin-adc"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── HOW TO READ: Cash Runway ─────────────────────────────────────────────
  {
    claimId: "glossary.cashRunway",
    claimText:
      "How many months your starting capital can absorb negative cash flow while census ramps up. The model ramps ADC linearly from zero to target over 12 months, then holds flat through month 18. This is a planning model — actual ramp curves vary.",
    claimClass: "formula_rule",
    sourceType: "engine_formula",
    sourceTitle: "Branch Profitability Engine — 18-month runway simulation",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["glossary-cash-runway"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: true,
  },

  // ── HOW TO READ: Admissions Needed ──────────────────────────────────────
  {
    claimId: "glossary.admissionsNeeded",
    claimText:
      "Monthly new patient admissions required to maintain target ADC, given average length of stay. Formula: (Target ADC × 365) ÷ LOS ÷ 12. This drives marketer headcount and individual production targets.",
    claimClass: "formula_rule",
    sourceType: "engine_formula",
    sourceTitle: "Branch Profitability Engine — monthly admissions formula",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["glossary-admissions-needed"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── Regulatory: hospice CoP staffing requirement ─────────────────────────
  {
    claimId: "regulatory.hospiceTeamRequired",
    claimText:
      "Medicare Conditions of Participation for Certified Hospices (42 CFR §418) require that every certified hospice maintain an interdisciplinary team including a physician, registered nurse, social worker, and chaplain or other counselor.",
    claimClass: "regulatory_fact",
    sourceType: "cms_regulation",
    sourceTitle: "42 CFR Part 418 — Medicare Hospice Conditions of Participation",
    sourceUrl: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-418",
    lastVerifiedDate: "2025-01-01",
    appliesTo: ["staffing-table-note"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: false,
  },

  // ── Model assumption: runway ramp model ──────────────────────────────────
  {
    claimId: "assumption.runwayRamp",
    claimText:
      "This simulator uses a simplified linear ramp: ADC grows evenly from 0 to target over 12 months, then holds flat through month 18. Real census ramps vary. Use this as a planning baseline, not a performance guarantee.",
    claimClass: "model_assumption",
    sourceType: "model_design",
    sourceTitle: "Branch Profitability Engine — runway ramp model",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["runway-table-disclaimer"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: true,
  },

  // ── Model assumption: staffing scaling ───────────────────────────────────
  {
    claimId: "assumption.staffingScaling",
    claimText:
      "RN Case Managers scale at 1 FTE per 12 patients above the 2-FTE minimum. Hospice Aides scale at 1 FTE per 8 patients above the 2-FTE minimum. Social Workers scale at 1 per 15. Chaplains scale at 1 per 20. All other roles are fixed at the minimum shown.",
    claimClass: "model_assumption",
    sourceType: "model_design",
    sourceTitle: "Branch Profitability Engine — staffing model (branchPresetConfigs.ts)",
    sourceUrl: "",
    lastVerifiedDate: "",
    appliesTo: ["staffing-table-note"],
    confidenceLevel: "high",
    reviewStatus: "current",
    requiresDisclaimer: true,
  },
];

// ─── Registry access ──────────────────────────────────────────────────────────

const REGISTRY: Map<string, ContentClaim> = new Map(
  CLAIMS.map((c) => [c.claimId, c])
);

/** Returns the claim for the given ID, or throws if not found. */
export function getClaim(claimId: string): ContentClaim {
  const claim = REGISTRY.get(claimId);
  if (!claim) {
    throw new Error(
      `[ContentRegistry] Unknown claimId: "${claimId}". ` +
      `All user-facing educational content must be registered before use.`
    );
  }
  return claim;
}

/** Returns the claimText for the given ID. Throws on unknown IDs. */
export function getClaimText(claimId: string): string {
  return getClaim(claimId).claimText;
}

/** Returns all registered claims. */
export function getAllClaims(): ContentClaim[] {
  return Array.from(REGISTRY.values());
}

/** Returns all claims that apply to a given screen location. */
export function getClaimsFor(location: string): ContentClaim[] {
  return CLAIMS.filter((c) => c.appliesTo.includes(location));
}

/** Content version — bump when claims are added or modified. */
export const CONTENT_VERSION = "2.0.0";
