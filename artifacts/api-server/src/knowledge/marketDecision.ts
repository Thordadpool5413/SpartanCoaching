import type { HospiceMeasure, HospiceProfile } from "./cmsHospiceLookup";

export type EvidenceConfidence = {
  score: number;
  label: "High" | "Moderate" | "Limited";
  availableSignals: number;
  possibleSignals: number;
  explanation: string;
};

export type MarketDecisionBrief = {
  title: string;
  purpose: string;
  recommendedMove: string;
  whyNow: string[];
  evidence: Array<{ label: string; value: string; period: string; interpretation: string }>;
  questionsToValidate: string[];
  nextActions: Array<{ timing: string; action: string; successSignal: string }>;
  stopConditions: string[];
  confidence: EvidenceConfidence;
  limitations: string[];
  sources: HospiceProfile["sources"];
};

function reported(measure: HospiceMeasure): boolean {
  return measure.score !== null && !/not reported|not available|not applicable/i.test(measure.displayScore);
}

function confidenceFor(profile: HospiceProfile): EvidenceConfidence {
  const qualityAvailable = profile.quality.filter(reported).length;
  const familyAvailable = profile.familyExperience.filter(reported).length;
  const availableSignals = Math.min(4, qualityAvailable) + Math.min(4, familyAvailable) +
    (profile.serviceArea.count > 0 ? 1 : 0) + (profile.organization.ownership !== "Unknown" ? 1 : 0);
  const possibleSignals = 10;
  const score = Math.round((availableSignals / possibleSignals) * 100);
  const label = score >= 80 ? "High" : score >= 50 ? "Moderate" : "Limited";
  return {
    score,
    label,
    availableSignals,
    possibleSignals,
    explanation: `${availableSignals} of ${possibleSignals} decision signals are available. Missing evidence lowers coverage and is never scored as poor performance.`,
  };
}

function strongestMeasures(measures: HospiceMeasure[], limit: number): HospiceMeasure[] {
  return measures
    .filter(reported)
    .sort((left, right) => Number(right.favorable === true) - Number(left.favorable === true))
    .slice(0, limit);
}

export function buildMarketDecisionBrief(profile: HospiceProfile, statedGoal?: string): MarketDecisionBrief {
  const organization = profile.organization;
  const name = organization.doingBusinessAs || organization.facilityName || organization.organizationName;
  const goal = statedGoal?.replace(/[{}<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 300) ||
    "Decide whether this account deserves focused field development.";
  const measures = strongestMeasures([...profile.quality, ...profile.familyExperience], 4);
  const confidence = confidenceFor(profile);
  const location = [organization.city, organization.state].filter(Boolean).join(", ");

  const evidence = [
    {
      label: "CMS-certified organization",
      value: `${name}${location ? `, ${location}` : ""}`,
      period: organization.certificationDate || "Current public record",
      interpretation: "Confirms public identity and location. It does not establish referral behavior or account access.",
    },
    {
      label: "Reported service area",
      value: profile.serviceArea.count > 0 ? `${profile.serviceArea.count} ZIP codes` : "Not reported",
      period: "Current CMS source snapshot",
      interpretation: "Reported geography is a market-orientation signal, not proof of current capacity or serviceability.",
    },
    ...measures.map((measure) => ({
      label: measure.name,
      value: measure.displayScore,
      period: measure.reportingPeriod || "Reporting period unavailable",
      interpretation: measure.comparisonLabel,
    })),
  ];

  return {
    title: `${name} decision brief`,
    purpose: goal,
    recommendedMove: confidence.label === "Limited"
      ? "Validate the missing evidence before committing significant territory time."
      : "Schedule a focused discovery conversation and test one account-specific value hypothesis.",
    whyNow: [
      profile.strengths[0] || "A verified CMS profile is available for structured preparation.",
      profile.serviceArea.count > 0
        ? `CMS reports ${profile.serviceArea.count} service-area ZIP codes that can guide territory questions.`
        : "Service-area evidence is missing, so geography must be confirmed directly.",
      `${confidence.label} evidence coverage supports a ${confidence.label === "High" ? "decisive" : "measured"} next step.`,
    ],
    evidence,
    questionsToValidate: [
      ...profile.questionsToAsk.slice(0, 4),
      "What has changed since the reporting periods shown in the public data?",
      "Who owns the next decision and what observable commitment would signal progress?",
    ].slice(0, 6),
    nextActions: [
      { timing: "Before the visit", action: "Review the reporting periods and mark every unavailable signal.", successSignal: "The rep can separate verified facts from hypotheses." },
      { timing: "In the conversation", action: "Validate one operational need and one decision owner.", successSignal: "The account confirms a real priority and who owns it." },
      { timing: "Within 24 hours", action: "Document the agreed action, owner, and date in Command.", successSignal: "A dated next commitment replaces a generic follow-up." },
    ],
    stopConditions: [
      "The public record cannot be matched to the organization being discussed.",
      "The reporting period is too old to support the intended conclusion without direct validation.",
      "The account does not confirm a relevant need, decision owner, or appropriate next step.",
    ],
    confidence,
    limitations: [
      profile.interpretation,
      "Public Medicare data does not prove referral volume, relationship strength, patient eligibility, current capacity, or willingness to refer.",
      "This brief supports sales preparation. It is not a clinical, compliance, reimbursement, or investment determination.",
    ],
    sources: profile.sources,
  };
}
