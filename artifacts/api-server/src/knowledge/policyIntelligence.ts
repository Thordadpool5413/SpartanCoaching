import {
  EDUCATIONAL_BASELINE_SOURCE,
  isEducationalBaselineSnapshot,
} from "../clinical/coverageBootstrap";

export const POLICY_TOPICS = [
  "hospice-benefit",
  "documentation",
  "levels-of-care",
  "election",
] as const;

export type PolicyTopic = (typeof POLICY_TOPICS)[number];

type CoverageSnapshotLike = {
  source?: string | null;
  documentId?: string | null;
  title?: string | null;
  jurisdiction?: string | null;
  sourceUrl?: string | null;
  effectiveAt?: Date | string | null;
  fetchedAt?: Date | string | null;
};

const GUIDANCE: Record<PolicyTopic, {
  title: string;
  answer: string;
  talkTrack: string;
  review: string[];
}> = {
  "hospice-benefit": {
    title: "Medicare hospice benefit overview",
    answer: "Hospice supports eligible people who choose comfort focused care when a physician certifies a terminal prognosis of six months or less if the illness follows its normal course.",
    talkTrack: "Hospice is not about giving up. It is a Medicare benefit built around comfort, support, and quality of life for the patient and family.",
    review: ["Confirm current CMS guidance", "Keep patient specific eligibility with the clinical team", "Explain choice without pressure"],
  },
  documentation: {
    title: "Documentation conversation guide",
    answer: "Strong documentation tells a clear story of the terminal condition, related conditions, functional change, symptom burden, utilization, and the clinical reasoning supporting the plan of care.",
    talkTrack: "The most useful record is not the longest one. It clearly shows what changed, why it matters, and what the clinical team observed over time.",
    review: ["Use objective trends when available", "Document clinical reasoning", "Do not make eligibility decisions from sales notes"],
  },
  "levels-of-care": {
    title: "Hospice levels of care overview",
    answer: "The Medicare hospice benefit includes routine home care, continuous home care, inpatient respite care, and general inpatient care. The clinical team determines the appropriate level based on the patient situation and coverage requirements.",
    talkTrack: "Hospice is a flexible model of support. The clinical team matches the level of care to what is happening and explains what is covered.",
    review: ["Avoid promising a level of care", "Confirm provider capability", "Escalate coverage questions to clinical leadership"],
  },
  election: {
    title: "Hospice election overview",
    answer: "A patient or authorized representative elects the Medicare hospice benefit for care related to the terminal illness while Medicare coverage continues for unrelated conditions under the applicable rules.",
    talkTrack: "Choosing hospice is an informed decision. Our job is to explain the benefit clearly, protect patient choice, and make room for questions.",
    review: ["Explain the election before signatures", "Protect voluntary choice", "Route benefit specific questions to qualified staff"],
  },
};

function isoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function buildPolicyBrief(topic: PolicyTopic, snapshot: CoverageSnapshotLike | null) {
  const guide = GUIDANCE[topic];
  const baseline = !snapshot || isEducationalBaselineSnapshot(snapshot);
  return {
    topic,
    title: guide.title,
    answer: guide.answer,
    talkTrack: guide.talkTrack,
    reviewChecklist: guide.review,
    source: {
      label: baseline ? "Spartan educational baseline" : "CMS Medicare Coverage Database",
      sourceType: baseline ? EDUCATIONAL_BASELINE_SOURCE : (snapshot?.source || "CMS_MCD"),
      documentId: snapshot?.documentId || null,
      documentTitle: snapshot?.title || null,
      jurisdiction: snapshot?.jurisdiction || "US",
      url: snapshot?.sourceUrl || "https://www.cms.gov/medicare/payment/fee-for-service-providers/hospice",
      effectiveAt: isoDate(snapshot?.effectiveAt),
      checkedAt: isoDate(snapshot?.fetchedAt) || new Date().toISOString(),
      liveCmsSnapshot: !baseline,
    },
    boundary: baseline
      ? "Educational guidance only. A live CMS coverage snapshot is not currently attached. Confirm current policy before use."
      : "Coverage guidance only. Confirm the cited document and keep patient specific eligibility decisions with qualified clinicians.",
  };
}
