/**
 * AI Uncertainty Boundaries & Escalation (HSP-23 Slice A).
 *
 * Structured states so Hospice Sales Pro can communicate uncertainty without
 * sounding broken, refuse patient-specific eligibility determinations from
 * sales inputs, and produce useful, specific escalations.
 *
 * Pure logic — no model calls, no DB, no secrets.
 */

export const UNCERTAINTY_BOUNDARIES_VERSION = "uncertainty-boundaries-v1";

/** Structured uncertainty states (HSP-23). */
export type UncertaintyStateId =
  | "sufficient"
  | "insufficient_information"
  | "payer_variation"
  | "provider_policy_variation"
  | "clinical_judgment_required"
  | "compliance_review_required"
  | "current_source_verification_required"
  | "unknown";

export type EscalationTarget =
  | "physician"
  | "clinical_leadership"
  | "compliance"
  | "provider_admin"
  | "source_owner"
  | "user_context"
  | "none";

export type UncertaintySourceRef = {
  id?: string;
  title?: string;
  /** Optional free-text stance for conflict detection. */
  claimSummary?: string;
  authority?: string;
  /** ISO date or YYYY-MM-DD — used for stale provider info. */
  asOf?: string;
  /** When true, this source is known to conflict with another. */
  conflictsWithIds?: string[];
  /** Provider-policy documents that may vary by agency. */
  isProviderPolicy?: boolean;
  /** Payer-specific rules (Medicare, Medicaid, commercial). */
  isPayerSpecific?: boolean;
};

export type UncertaintyAssessmentInput = {
  /** User question / tool input (de-identified). */
  question: string;
  /** Optional model or tool output already produced. */
  output?: string;
  /** Known sources used or available for the answer. */
  sources?: UncertaintySourceRef[];
  /** Workflow hint adjusts thresholds (sales vs clinical education). */
  workflow?:
    | "objection"
    | "playbook"
    | "email"
    | "roleplay"
    | "research"
    | "account_guidance"
    | "clinical_education"
    | "other";
  /** Explicit flags from host (e.g. provider knowledge marked outdated). */
  flags?: {
    providerInfoOutdated?: boolean;
    sourcesConflict?: boolean;
    incompleteAccountContext?: boolean;
    highRiskClinical?: boolean;
  };
  /** Optional "now" for stale checks (tests). */
  now?: Date;
};

export type EscalationPlan = {
  required: boolean;
  escalateTo: EscalationTarget;
  /** Machine-readable reason code. */
  reasonCode: string;
  /** Specific next action for the rep (useful, not vague). */
  specificAction: string;
  /** Calm user-facing message — "I don't know" without sounding broken. */
  userFacingMessage: string;
};

export type UncertaintyAssessment = {
  version: typeof UNCERTAINTY_BOUNDARIES_VERSION;
  /** Primary state to surface in UI. */
  primaryState: UncertaintyStateId;
  /** All applicable states (ordered by severity). */
  states: UncertaintyStateId[];
  /** Why these states were selected (codes only). */
  signals: string[];
  escalation: EscalationPlan;
  /**
   * When true, host should not call the model for a determination-style answer.
   * Return the structured envelope instead.
   */
  blockModelGeneration: boolean;
  /**
   * Hard rule: never produce patient-specific eligibility from sales inputs.
   */
  eligibilityDeterminationBlocked: boolean;
  /** Safe coaching / education text the client may show immediately. */
  safeResponse: string;
  /** Confidence 0..1 for how complete the answer can be under these bounds. */
  answerConfidence: number;
};

const STATE_SEVERITY: Record<UncertaintyStateId, number> = {
  clinical_judgment_required: 100,
  compliance_review_required: 90,
  unknown: 80,
  current_source_verification_required: 70,
  provider_policy_variation: 60,
  payer_variation: 55,
  insufficient_information: 40,
  sufficient: 0,
};

const ELIGIBILITY_DETERMINATION_PATTERNS: RegExp[] = [
  /\b(?:is|are|was|were)\s+(?:this|the|my|our)?\s*(?:patient|pt|resident|family member|he|she|they)\s+(?:eligible|ineligible|qualified|qualify|meet(?:s)?\s+(?:hospice\s+)?criteria)\b/i,
  /\b(?:does|do|did)\s+(?:this|the|my|our)?\s*(?:patient|pt|resident)\s+qualify\b/i,
  /\b(?:determine|decide|certify)\s+(?:eligibility|if\s+(?:they|he|she|the patient)\s+(?:is\s+)?eligible)\b/i,
  /\b(?:can\s+you|please)\s+(?:tell\s+me\s+)?(?:if|whether)\s+(?:this|the)\s+patient\s+(?:is\s+)?eligible\b/i,
  /\beligibility\s+determination\b/i,
  /\b(?:admit|enroll)\s+(?:this|the)\s+patient\s+(?:now|today|to\s+hospice)\b/i,
];

const HIGH_RISK_CLINICAL_PATTERNS: RegExp[] = [
  /\b(?:prognosis|life expectancy|how long (?:do|will) (?:they|he|she|the patient) (?:have|live))\b/i,
  /\b(?:stop|discontinue|withdraw)\s+(?:all\s+)?(?:treatment|meds|medications|dialysis|chemo)\b/i,
  /\b(?:what\s+dose|prescribe|titrate)\b/i,
  /\b(?:diagnose|diagnosis\s+for\s+(?:this|the)\s+patient)\b/i,
  ...ELIGIBILITY_DETERMINATION_PATTERNS,
];

const PAYER_VARIATION_PATTERNS: RegExp[] = [
  /\b(?:medicare|medicaid|advantage|commercial\s+payer|insurance|coverage\s+varies|payer[- ]specific)\b/i,
  /\b(?:does\s+(?:their|the)\s+insurance\s+cover)\b/i,
];

const PROVIDER_POLICY_PATTERNS: RegExp[] = [
  /\b(?:our\s+(?:agency|organization|hospice)\s+policy|company\s+policy|provider[- ]specific|we\s+offer|do\s+we\s+(?:provide|offer|cover))\b/i,
  /\b(?:service\s+area|admission\s+hours|on[- ]call\s+policy)\b/i,
];

const AMBIGUOUS_OR_THIN: RegExp[] = [
  /^(?:what about|tell me about|hospice\??|help|info|more)\s*$/i,
  /\b(?:stuff|things|whatever|idk)\b/i,
];

const COMPLIANCE_PATTERNS: RegExp[] = [
  /\b(?:anti[- ]kickback|stark|false\s+claims|inducement|gift\s+limits?|compliance\s+review)\b/i,
  /\b(?:can\s+i\s+(?:pay|bribe|incentivize)\s+(?:for\s+)?referrals?)\b/i,
];

const STALE_PROVIDER_MS = 180 * 24 * 60 * 60 * 1000; // ~6 months

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => {
    p.lastIndex = 0;
    return p.test(text);
  });
}

/** True when the input asks for a patient-specific eligibility determination. */
export function isPatientEligibilityDeterminationRequest(text: string): boolean {
  const t = (text || "").trim();
  if (!t) return false;
  return hasAny(t, ELIGIBILITY_DETERMINATION_PATTERNS);
}

/** High-risk clinical framing that sales tools must not answer as fact. */
export function isHighRiskClinicalQuestion(text: string): boolean {
  return hasAny(text || "", HIGH_RISK_CLINICAL_PATTERNS);
}

function parseAsOf(asOf: string | undefined, now: Date): Date | null {
  if (!asOf) return null;
  const d = new Date(asOf);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getTime() > now.getTime() + 24 * 60 * 60 * 1000) return null;
  return d;
}

function sourcesConflict(sources: UncertaintySourceRef[] | undefined): boolean {
  if (!sources?.length) return false;
  if (sources.some((s) => (s.conflictsWithIds?.length ?? 0) > 0)) return true;
  // Same title family with opposing claim summaries
  const claims = sources
    .map((s) => (s.claimSummary || "").trim().toLowerCase())
    .filter(Boolean);
  if (claims.length >= 2) {
    const hasYes = claims.some((c) => /\b(?:yes|eligible|covers|allowed|true)\b/.test(c));
    const hasNo = claims.some((c) => /\b(?:no|ineligible|does not cover|prohibited|false)\b/.test(c));
    if (hasYes && hasNo) return true;
  }
  return false;
}

function sourcesStale(
  sources: UncertaintySourceRef[] | undefined,
  now: Date,
): boolean {
  if (!sources?.length) return false;
  return sources.some((s) => {
    if (!s.isProviderPolicy && !s.authority?.includes("provider")) return false;
    const d = parseAsOf(s.asOf, now);
    if (!d) return Boolean(s.isProviderPolicy && !s.asOf);
    return now.getTime() - d.getTime() > STALE_PROVIDER_MS;
  });
}

function pickPrimary(states: UncertaintyStateId[]): UncertaintyStateId {
  if (!states.length) return "sufficient";
  return [...states].sort(
    (a, b) => STATE_SEVERITY[b] - STATE_SEVERITY[a],
  )[0];
}

function buildEscalation(
  primary: UncertaintyStateId,
  signals: string[],
): EscalationPlan {
  switch (primary) {
    case "clinical_judgment_required":
      return {
        required: true,
        escalateTo: "physician",
        reasonCode: "CLINICAL_JUDGMENT_REQUIRED",
        specificAction:
          "Offer an educational overview of general criteria only, then ask the referral source to involve their attending physician or your medical director for a clinical consult—do not state whether a named patient is eligible.",
        userFacingMessage:
          "I can't determine eligibility for a specific patient from sales inputs. Eligibility is a clinical decision. I can help you prepare questions for the physician or medical director.",
      };
    case "compliance_review_required":
      return {
        required: true,
        escalateTo: "compliance",
        reasonCode: "COMPLIANCE_REVIEW_REQUIRED",
        specificAction:
          "Pause outreach that involves incentives, gifts, or payment-for-referral language. Route the scenario to your compliance lead with the exact question (no PHI) before answering the account.",
        userFacingMessage:
          "This touches compliance rules I should not improvise. Your compliance lead should review the specific scenario before you respond.",
      };
    case "current_source_verification_required":
      return {
        required: true,
        escalateTo: "source_owner",
        reasonCode: "SOURCE_VERIFICATION_REQUIRED",
        specificAction:
          "Verify the current policy snapshot, LCD, or provider document with the source owner before quoting it in the field. Do not present unverified or conflicting material as settled fact.",
        userFacingMessage:
          "I don't have a verified current source for that claim. Let's confirm the latest approved document before you use it with an account.",
      };
    case "provider_policy_variation":
      return {
        required: true,
        escalateTo: "provider_admin",
        reasonCode: "PROVIDER_POLICY_VARIATION",
        specificAction:
          "Check your agency's approved service list, geography, and messaging guide. If those docs are outdated, ask provider ops/admin for the current version before promising services.",
        userFacingMessage:
          "That answer depends on your organization's current policy, which can differ from another hospice. Confirm your approved provider guidance before you commit.",
      };
    case "payer_variation":
      return {
        required: true,
        escalateTo: "clinical_leadership",
        reasonCode: "PAYER_VARIATION",
        specificAction:
          "Frame coverage at a high level (e.g. Medicare hospice benefit exists) and escalate plan-specific benefit questions to clinical/intake leadership or the payer resource—not as a sales determination.",
        userFacingMessage:
          "Coverage details often vary by payer and plan. I can share general education, but plan-specific answers need verification with intake or clinical leadership.",
      };
    case "insufficient_information":
      return {
        required: true,
        escalateTo: "user_context",
        reasonCode: "INSUFFICIENT_INFORMATION",
        specificAction:
          "Ask 2–3 clarifying questions (setting, relationship stage, objection theme, what the account asked) before generating a full talk track or plan.",
        userFacingMessage:
          "I need a bit more context to be useful. Share the setting and what was said (no patient identifiers), and I'll give you a tighter next move.",
      };
    case "unknown":
      return {
        required: true,
        escalateTo: "source_owner",
        reasonCode: "UNKNOWN_ANSWER",
        specificAction:
          "Say you will confirm rather than invent. Log the question, check approved sources, and follow up with the account by a specific time.",
        userFacingMessage:
          "I don't know that with confidence from the information I have—and inventing an answer would be worse. Let's verify, then you can follow up with a clear answer.",
      };
    case "sufficient":
    default:
      return {
        required: false,
        escalateTo: "none",
        reasonCode: "WITHIN_BOUNDS",
        specificAction:
          "Proceed with coaching-style guidance. Keep clinical determinations with physicians and avoid PHI.",
        userFacingMessage:
          "Here is field coaching within normal bounds. Adapt to the room and keep eligibility decisions with the clinical team.",
      };
  }
}

function buildSafeResponse(
  primary: UncertaintyStateId,
  eligibilityBlocked: boolean,
  escalation: EscalationPlan,
): string {
  if (eligibilityBlocked || primary === "clinical_judgment_required") {
    return [
      escalation.userFacingMessage,
      "",
      "What I can do:",
      "• Help you educate on general hospice criteria and process (no patient-specific determination).",
      "• Suggest questions for the attending physician or medical director.",
      "• Prep an empathetic talk track that protects patient choice.",
      "",
      `Next move: ${escalation.specificAction}`,
    ].join("\n");
  }
  if (primary === "sufficient") {
    return escalation.userFacingMessage;
  }
  return [
    escalation.userFacingMessage,
    "",
    `Next move: ${escalation.specificAction}`,
  ].join("\n");
}

/**
 * Assess uncertainty and escalation for a sales / coaching AI interaction.
 * Never authorizes patient-specific eligibility determinations.
 */
export function assessUncertainty(
  input: UncertaintyAssessmentInput,
): UncertaintyAssessment {
  const question = (input.question || "").trim();
  const output = (input.output || "").trim();
  const combined = `${question}\n${output}`;
  const now = input.now ?? new Date();
  const signals: string[] = [];
  const stateSet = new Set<UncertaintyStateId>();

  const eligibilityBlocked =
    isPatientEligibilityDeterminationRequest(question) ||
    isPatientEligibilityDeterminationRequest(output) ||
    Boolean(input.flags?.highRiskClinical && isHighRiskClinicalQuestion(question));

  if (isPatientEligibilityDeterminationRequest(question)) {
    signals.push("ELIGIBILITY_DETERMINATION_REQUEST");
    stateSet.add("clinical_judgment_required");
  }

  if (isHighRiskClinicalQuestion(question) || input.flags?.highRiskClinical) {
    signals.push("HIGH_RISK_CLINICAL");
    stateSet.add("clinical_judgment_required");
  }

  if (hasAny(combined, COMPLIANCE_PATTERNS)) {
    signals.push("COMPLIANCE_SENSITIVE");
    stateSet.add("compliance_review_required");
  }

  if (
    hasAny(combined, PAYER_VARIATION_PATTERNS) ||
    input.sources?.some((s) => s.isPayerSpecific)
  ) {
    signals.push("PAYER_SENSITIVE");
    stateSet.add("payer_variation");
  }

  if (
    hasAny(combined, PROVIDER_POLICY_PATTERNS) ||
    input.sources?.some((s) => s.isProviderPolicy)
  ) {
    signals.push("PROVIDER_POLICY_SENSITIVE");
    stateSet.add("provider_policy_variation");
  }

  const conflict =
    Boolean(input.flags?.sourcesConflict) || sourcesConflict(input.sources);
  if (conflict) {
    signals.push("CONFLICTING_SOURCES");
    stateSet.add("current_source_verification_required");
    stateSet.add("unknown");
  }

  const stale =
    Boolean(input.flags?.providerInfoOutdated) ||
    sourcesStale(input.sources, now);
  if (stale) {
    signals.push("OUTDATED_PROVIDER_INFORMATION");
    stateSet.add("current_source_verification_required");
    stateSet.add("provider_policy_variation");
  }

  const thinQuestion =
    question.length > 0 &&
    (question.length < 12 ||
      hasAny(question, AMBIGUOUS_OR_THIN) ||
      Boolean(input.flags?.incompleteAccountContext));

  if (thinQuestion && !eligibilityBlocked) {
    signals.push("INCOMPLETE_OR_AMBIGUOUS_CONTEXT");
    stateSet.add("insufficient_information");
  }

  // Output that overclaims eligibility despite sales context
  if (
    output &&
    /\b(?:this patient (?:is|was) (?:clearly )?(?:eligible|ineligible)|qualifies for hospice)\b/i.test(
      output,
    )
  ) {
    signals.push("OUTPUT_ELIGIBILITY_OVERCLAIM");
    stateSet.add("clinical_judgment_required");
  }

  if (!question && !output) {
    signals.push("EMPTY_INPUT");
    stateSet.add("insufficient_information");
  }

  // If nothing raised, sufficient
  if (stateSet.size === 0) {
    stateSet.add("sufficient");
    signals.push("WITHIN_BOUNDS");
  }

  // Never leave eligibility as sufficient
  if (eligibilityBlocked) {
    stateSet.delete("sufficient");
    stateSet.add("clinical_judgment_required");
  }

  const states = [...stateSet].sort(
    (a, b) => STATE_SEVERITY[b] - STATE_SEVERITY[a],
  );
  const primaryState = pickPrimary(states);
  const escalation = buildEscalation(primaryState, signals);
  const blockModelGeneration =
    eligibilityBlocked ||
    primaryState === "clinical_judgment_required" ||
    primaryState === "compliance_review_required";

  let answerConfidence = 0.85;
  if (primaryState === "sufficient") answerConfidence = 0.85;
  else if (primaryState === "insufficient_information") answerConfidence = 0.35;
  else if (primaryState === "payer_variation") answerConfidence = 0.45;
  else if (primaryState === "provider_policy_variation") answerConfidence = 0.4;
  else if (primaryState === "current_source_verification_required")
    answerConfidence = 0.3;
  else if (primaryState === "unknown") answerConfidence = 0.15;
  else if (primaryState === "compliance_review_required") answerConfidence = 0.2;
  else if (primaryState === "clinical_judgment_required") answerConfidence = 0.1;

  return {
    version: UNCERTAINTY_BOUNDARIES_VERSION,
    primaryState,
    states,
    signals,
    escalation,
    blockModelGeneration,
    eligibilityDeterminationBlocked: eligibilityBlocked || blockModelGeneration && primaryState === "clinical_judgment_required",
    safeResponse: buildSafeResponse(
      primaryState,
      eligibilityBlocked,
      escalation,
    ),
    answerConfidence,
  };
}

/**
 * Public helper for routes: pre-check input before model call.
 * If blocked, return the assessment; otherwise null (caller continues).
 */
export function preflightUncertainty(
  question: string,
  opts?: Omit<UncertaintyAssessmentInput, "question">,
): UncertaintyAssessment | null {
  const assessment = assessUncertainty({ question, ...opts });
  if (assessment.blockModelGeneration) return assessment;
  return null;
}

/**
 * Attach post-generation uncertainty (e.g. incomplete context, payer cues).
 * Does not re-block eligibility if already answered — but will flag overclaims.
 */
export function postflightUncertainty(
  question: string,
  output: string,
  opts?: Omit<UncertaintyAssessmentInput, "question" | "output">,
): UncertaintyAssessment {
  return assessUncertainty({ question, output, ...opts });
}
