import {
  ANDWELL_CARE_REGISTRY_VERSION,
  ANDWELL_CARE_SERVICES,
  andwellServiceAvailability,
  getAndwellCareService,
  type AndwellServiceId,
} from "./andwellCareRegistry";

export interface AndwellCareContext {
  county?: string | null;
  currentServiceIds?: readonly AndwellServiceId[];
}

export interface AndwellCareEvidence {
  path: string;
  text: string;
}

export interface AndwellCareOpportunity {
  serviceId: AndwellServiceId;
  serviceName: string;
  family: string;
  status: "clinical_review_suggested";
  reason: string[];
  evidence: AndwellCareEvidence[];
  missingChecks: string[];
  availability: "available" | "not_listed" | "verify";
  reviewerRole: string;
  sourceUrl: string;
  humanReviewRequired: true;
  eligibilityDetermined: false;
}

export interface AndwellContinuumReview {
  registryVersion: typeof ANDWELL_CARE_REGISTRY_VERSION;
  screenedServiceCount: number;
  opportunities: AndwellCareOpportunity[];
  limitations: string[];
  humanReviewRequired: true;
}

type EvidenceSignal = {
  label: string;
  patterns: readonly RegExp[];
};

type ServiceRule = {
  serviceId: AndwellServiceId;
  signals: readonly EvidenceSignal[];
  minimumSignals: number;
  requireAny?: readonly string[];
  requireAll?: readonly string[];
};

type LocatedText = {
  path: string;
  text: string;
  normalized: string;
};

const rules: readonly ServiceRule[] = [
  {
    serviceId: "home-health",
    minimumSignals: 2,
    signals: [
      { label: "recent transition or skilled-care need", patterns: [/hospital discharge/i, /recent hospitalization/i, /post[- ]?op/i, /skilled nursing/i, /home health/i] },
      { label: "homebound or mobility limitation", patterns: [/homebound/i, /requires assistance.*(ambulat|transfer|mobility)/i, /unable to leave home/i, /fall risk/i] },
      { label: "rehabilitation need", patterns: [/physical therapy/i, /occupational therapy/i, /speech therapy/i, /rehab/i, /gait/i, /transfer/i] },
      { label: "complex home clinical need", patterns: [/infusion/i, /picc/i, /wound/i, /ostomy/i, /diabetes management/i, /medication management/i] },
    ],
  },
  {
    serviceId: "caregivers",
    minimumSignals: 1,
    signals: [
      { label: "activities-of-daily-living support", patterns: [/activities of daily living/i, /adl/i, /bathing/i, /dressing/i, /toileting/i, /meal preparation/i, /needs assistance/i] },
      { label: "caregiver strain or respite need", patterns: [/caregiver burden/i, /caregiver strain/i, /caregiver fatigue/i, /respite/i, /caregiver.*overwhelm/i] },
      { label: "supervision or companionship need", patterns: [/requires supervision/i, /cannot be left alone/i, /social isolation/i, /companionship/i] },
    ],
  },
  {
    serviceId: "guide",
    minimumSignals: 1,
    signals: [
      { label: "documented dementia/cognitive need", patterns: [/dementia/i, /alzheimer/i, /cognitive decline/i, /memory loss/i, /memory impairment/i] },
    ],
  },
  {
    serviceId: "mobile-wound",
    minimumSignals: 1,
    signals: [
      { label: "wound/ostomy/continence need", patterns: [/wound/i, /pressure (injury|ulcer)/i, /diabetic ulcer/i, /non[- ]?healing/i, /ostomy/i, /stoma/i, /continence/i] },
    ],
  },
  {
    serviceId: "palliative-medicine",
    minimumSignals: 2,
    signals: [
      { label: "serious illness", patterns: [/chf/i, /heart failure/i, /copd/i, /cancer/i, /metastatic/i, /advanced.*disease/i, /serious illness/i, /life[- ]limiting/i] },
      { label: "symptom burden", patterns: [/dyspnea/i, /shortness of breath/i, /pain/i, /nausea/i, /fatigue/i, /symptom burden/i] },
      { label: "high utilization or disease progression", patterns: [/recurrent hospital/i, /multiple hospital/i, /frequent emergency/i, /progressive decline/i, /disease progression/i] },
      { label: "goals-of-care or caregiver need", patterns: [/goals of care/i, /treatment decision/i, /caregiver burden/i, /quality of life/i] },
    ],
  },
  {
    serviceId: "hospice-home-care",
    minimumSignals: 2,
    signals: [
      { label: "terminal/advanced illness", patterns: [/terminal/i, /end[- ]stage/i, /advanced.*disease/i, /metastatic/i, /life expectancy/i, /prognosis/i] },
      { label: "documented decline", patterns: [/functional decline/i, /progressive decline/i, /weight loss/i, /poor intake/i, /bedbound/i, /increased dependence/i] },
      { label: "recurrent utilization", patterns: [/recurrent hospital/i, /multiple hospital/i, /frequent emergency/i] },
      { label: "significant symptom burden", patterns: [/uncontrolled pain/i, /refractory/i, /dyspnea/i, /shortness of breath/i] },
    ],
  },
  {
    serviceId: "inpatient-hospice",
    minimumSignals: 2,
    requireAny: ["current hospice", "hospice"],
    signals: [
      { label: "current hospice context", patterns: [/current hospice/i, /enrolled in hospice/i, /hospice patient/i] },
      { label: "intensive symptom-management need", patterns: [/uncontrolled pain/i, /uncontrolled symptoms/i, /refractory symptoms/i, /symptom crisis/i, /severe dyspnea/i] },
    ],
  },
  {
    serviceId: "forget-me-not",
    minimumSignals: 2,
    requireAll: ["hospice", "dementia"],
    signals: [
      { label: "hospice context", patterns: [/hospice patient/i, /current hospice/i, /enrolled in hospice/i] },
      { label: "dementia/memory need", patterns: [/dementia/i, /alzheimer/i, /memory loss/i, /agitation/i, /confusion/i] },
    ],
  },
  {
    serviceId: "emotional-spiritual-support",
    minimumSignals: 1,
    signals: [
      { label: "emotional/spiritual distress", patterns: [/spiritual distress/i, /existential/i, /fear of dying/i, /family conflict/i, /emotional distress/i, /loss of meaning/i, /chaplain/i] },
    ],
  },
  {
    serviceId: "bereavement-support",
    minimumSignals: 1,
    signals: [
      { label: "grief/loss need", patterns: [/bereavement/i, /anticipatory grief/i, /grief/i, /recent death/i, /loss of .*family/i] },
    ],
  },
  {
    serviceId: "behavioral-health-outpatient",
    minimumSignals: 1,
    signals: [
      { label: "mental-health or co-occurring need", patterns: [/depression/i, /anxiety/i, /trauma/i, /ptsd/i, /substance use/i, /alcohol use disorder/i, /opioid use disorder/i, /behavioral health/i] },
    ],
  },
  {
    serviceId: "behavioral-health-home-adult",
    minimumSignals: 2,
    signals: [
      { label: "adult behavioral-health need", patterns: [/adult.*behavioral health/i, /depression/i, /anxiety/i, /ptsd/i, /serious mental illness/i] },
      { label: "care-coordination complexity", patterns: [/care coordination/i, /multiple chronic/i, /frequent emergency/i, /housing instability/i, /food insecurity/i, /transportation barrier/i] },
    ],
  },
  {
    serviceId: "behavioral-health-home-child",
    minimumSignals: 2,
    signals: [
      { label: "child/youth behavioral-health need", patterns: [/pediatric/i, /child/i, /adolescent/i, /youth/i] },
      { label: "behavioral-health concern", patterns: [/behavioral health/i, /depression/i, /anxiety/i, /adhd/i, /trauma/i, /emotional dysregulation/i] },
      { label: "coordination need", patterns: [/school support/i, /care coordination/i, /family support/i, /community support/i] },
    ],
  },
  {
    serviceId: "community-care-team",
    minimumSignals: 2,
    signals: [
      { label: "complex medical/utilization need", patterns: [/multiple chronic/i, /complex chronic/i, /frequent emergency/i, /recurrent hospital/i, /care coordination/i] },
      { label: "social/resource barrier", patterns: [/food insecurity/i, /housing instability/i, /transportation barrier/i, /unable to access.*primary care/i, /social determinant/i] },
    ],
  },
  {
    serviceId: "home-program",
    minimumSignals: 1,
    signals: [
      { label: "homelessness/housing instability", patterns: [/homeless/i, /unsheltered/i, /housing instability/i, /unstable housing/i, /housing insecurity/i] },
    ],
  },
  {
    serviceId: "adult-hcbs",
    minimumSignals: 2,
    signals: [
      { label: "adult status", patterns: [/adult/i, /age (1[89]|[2-9]\d)/i] },
      { label: "intellectual disability/autism", patterns: [/intellectual disab/i, /developmental disab/i, /autism/i, /asd/i] },
      { label: "functional/community support need", patterns: [/independent living/i, /community integration/i, /daily living support/i, /adl/i] },
    ],
  },
  {
    serviceId: "adult-day",
    minimumSignals: 2,
    signals: [
      { label: "intellectual/developmental disability", patterns: [/intellectual disab/i, /developmental disab/i, /autism/i] },
      { label: "structured day/supervision need", patterns: [/day program/i, /structured activity/i, /requires supervision/i, /community integration/i, /social support/i] },
    ],
  },
  {
    serviceId: "child-rcs",
    minimumSignals: 2,
    signals: [
      { label: "child/youth status", patterns: [/pediatric/i, /child/i, /adolescent/i, /youth/i] },
      { label: "behavioral-health diagnosis/need", patterns: [/behavioral health/i, /emotional dysregulation/i, /anxiety/i, /depression/i, /adhd/i, /trauma/i] },
      { label: "functional skill need", patterns: [/functional impairment/i, /self[- ]regulation/i, /social skills/i, /daily living/i] },
    ],
  },
  {
    serviceId: "adult-therapy",
    minimumSignals: 1,
    signals: [
      { label: "adult therapy/rehabilitation need", patterns: [/physical therapy/i, /occupational therapy/i, /speech therapy/i, /pt/i, /ot/i, /slp/i, /dysphagia/i, /gait/i, /stroke/i, /parkinson/i, /traumatic brain injury/i, /tbi/i] },
    ],
  },
  {
    serviceId: "pediatric-therapy",
    minimumSignals: 2,
    signals: [
      { label: "pediatric status", patterns: [/pediatric/i, /child/i, /infant/i, /adolescent/i] },
      { label: "developmental/therapy need", patterns: [/developmental delay/i, /speech delay/i, /language delay/i, /sensory/i, /fine motor/i, /gross motor/i, /occupational therapy/i, /physical therapy/i, /speech therapy/i] },
    ],
  },
  {
    serviceId: "audiology",
    minimumSignals: 1,
    signals: [
      { label: "hearing/audiology need", patterns: [/hearing loss/i, /hearing impairment/i, /hearing aid/i, /difficulty hearing/i, /audiolog/i] },
    ],
  },
  {
    serviceId: "maternal-child-health",
    minimumSignals: 2,
    signals: [
      { label: "maternal/pediatric status", patterns: [/pregnan/i, /postpartum/i, /newborn/i, /infant/i, /pediatric/i, /child/i] },
      { label: "complex maternal/child clinical need", patterns: [/high[- ]risk pregnancy/i, /feeding tube/i, /g[- ]?tube/i, /failure to thrive/i, /congenital heart/i, /genetic condition/i, /pediatric cancer/i, /picc/i, /port/i, /infusion/i, /medically fragile/i] },
    ],
  },
] as const;

function collectText(value: unknown, path = "output", out: LocatedText[] = []): LocatedText[] {
  if (typeof value === "string") {
    const text = value.trim();
    if (text) out.push({ path, text, normalized: text.toLowerCase() });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectText(item, `${path}[${index}]`, out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      collectText(child, `${path}.${key}`, out);
    }
  }
  return out;
}

function signalEvidence(signal: EvidenceSignal, corpus: readonly LocatedText[]): LocatedText[] {
  return corpus.filter((item) => signal.patterns.some((pattern) => pattern.test(item.text)));
}

function containsPhrase(corpus: readonly LocatedText[], phrase: string): boolean {
  const normalized = phrase.toLowerCase();
  return corpus.some((item) => item.normalized.includes(normalized));
}

function uniqueEvidence(items: readonly LocatedText[], limit = 4): AndwellCareEvidence[] {
  const seen = new Set<string>();
  const evidence: AndwellCareEvidence[] = [];
  for (const item of items) {
    const key = `${item.path}|${item.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    evidence.push({
      path: item.path,
      text: item.text.length > 360 ? `${item.text.slice(0, 357)}...` : item.text,
    });
    if (evidence.length >= limit) break;
  }
  return evidence;
}

export function buildAndwellContinuumReview(
  clinicalOutput: unknown,
  context: AndwellCareContext = {},
): AndwellContinuumReview {
  const corpus = collectText(clinicalOutput);
  const current = new Set(context.currentServiceIds ?? []);
  const opportunities: AndwellCareOpportunity[] = [];

  for (const rule of rules) {
    if (current.has(rule.serviceId)) continue;
    if (rule.requireAny?.length && !rule.requireAny.some((phrase) => containsPhrase(corpus, phrase))) continue;
    if (rule.requireAll?.length && !rule.requireAll.every((phrase) => containsPhrase(corpus, phrase))) continue;

    const matched = rule.signals
      .map((signal) => ({ signal, evidence: signalEvidence(signal, corpus) }))
      .filter((match) => match.evidence.length > 0);

    if (matched.length < rule.minimumSignals) continue;

    const service = getAndwellCareService(rule.serviceId);
    opportunities.push({
      serviceId: service.id,
      serviceName: service.name,
      family: service.family,
      status: "clinical_review_suggested",
      reason: matched.map((match) => match.signal.label),
      evidence: uniqueEvidence(matched.flatMap((match) => match.evidence)),
      missingChecks: [...service.eligibilityChecks],
      availability: andwellServiceAvailability(service.id, context.county),
      reviewerRole: service.reviewerRole,
      sourceUrl: service.sourceUrl,
      humanReviewRequired: true,
      eligibilityDetermined: false,
    });
  }

  return {
    registryVersion: ANDWELL_CARE_REGISTRY_VERSION,
    screenedServiceCount: ANDWELL_CARE_SERVICES.length,
    opportunities,
    limitations: [
      "This screening uses only deidentified facts already present in the clinical draft; absence of a flag does not mean a need is absent.",
      "A flagged service is a potential care opportunity for qualified review, not an eligibility, coverage, level-of-care, admission, or treatment determination.",
      "Payer, current enrollment, geography, orders/referrals, capacity, patient preference, and program-specific criteria must be verified by the responsible Andwell team.",
      "Service criteria and availability can change; the approved Andwell registry must be reviewed and versioned before production use.",
    ],
    humanReviewRequired: true,
  };
}
