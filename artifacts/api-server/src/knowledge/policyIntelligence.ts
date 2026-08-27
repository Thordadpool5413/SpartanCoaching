import {
  EDUCATIONAL_BASELINE_SOURCE,
  isEducationalBaselineSnapshot,
} from "../clinical/coverageBootstrap";

export const POLICY_TOPICS = [
  "hospice-benefit",
  "eligibility-certification",
  "election",
  "election-addendum",
  "revocation-discharge",
  "plan-of-care-idg",
  "levels-of-care",
  "continuous-home-care",
  "general-inpatient-care",
  "inpatient-respite",
  "face-to-face-recertification",
  "documentation",
] as const;

export const POLICY_AUDIENCES = ["family", "referral-source", "sales-rep", "clinical-leader"] as const;

export type PolicyTopic = (typeof POLICY_TOPICS)[number];
export type PolicyAudience = (typeof POLICY_AUDIENCES)[number];

type CoverageSnapshotLike = {
  source?: string | null;
  documentId?: string | null;
  title?: string | null;
  jurisdiction?: string | null;
  sourceUrl?: string | null;
  effectiveAt?: Date | string | null;
  fetchedAt?: Date | string | null;
};

type Guidance = {
  title: string;
  answer: string;
  facts: string[];
  talkTrack: string;
  verify: string[];
  avoid: string[];
  escalation: string;
  section: string;
};

const GUIDANCE: Record<PolicyTopic, Guidance> = {
  "hospice-benefit": {
    title: "Medicare hospice benefit",
    answer: "The Medicare hospice benefit supports eligible people who choose comfort focused care. It includes an interdisciplinary plan of care, medicines and services related to the terminal illness, caregiver support, and several levels of care when requirements are met.",
    facts: ["The patient keeps Medicare coverage for care unrelated to the terminal illness.", "Hospice care is organized around an interdisciplinary plan of care.", "The patient keeps the right to choose the hospice and may revoke the election."],
    talkTrack: "Hospice is a Medicare benefit focused on comfort, support, and quality of life. The clinical team confirms eligibility and builds a plan around what the patient and family need.",
    verify: ["Confirm the current CMS benefit guidance.", "Confirm what the selected hospice can provide.", "Keep patient specific eligibility with qualified clinicians."],
    avoid: ["Do not describe hospice as giving up.", "Do not promise coverage for a specific service before review."],
    escalation: "Send patient specific benefit or eligibility questions to the hospice clinical team.",
    section: "42 CFR Part 418 and Medicare Benefit Policy Manual, Chapter 9",
  },
  "eligibility-certification": {
    title: "Eligibility and certification",
    answer: "Hospice eligibility requires physician certification that the individual is terminally ill with a prognosis of six months or less if the illness runs its normal course. Certification periods and required physician roles must follow current Medicare rules.",
    facts: ["A prognosis is a clinical judgment, not a sales decision.", "The record must support the certification and the terminal prognosis.", "Eligibility is reassessed for later benefit periods."],
    talkTrack: "The hospice clinical team reviews the full picture and the physicians make the certification decision. We can help the team understand the process without predicting an outcome.",
    verify: ["Confirm the certifying physician requirements for the benefit period.", "Confirm supporting clinical documentation.", "Confirm dates and signatures before billing."],
    avoid: ["Do not say a person definitely qualifies.", "Do not reduce eligibility to one diagnosis, score, or utilization event."],
    escalation: "Route every patient specific determination to the hospice physician or medical director.",
    section: "42 CFR 418.20 and 418.22",
  },
  election: {
    title: "Hospice election",
    answer: "A patient or authorized representative elects hospice through a signed statement after receiving an explanation of the benefit. The election identifies the hospice and acknowledges the palliative focus and the effects of the election.",
    facts: ["The choice must be informed and voluntary.", "The election statement has required content.", "The hospice must provide information about services and cost sharing."],
    talkTrack: "Choosing hospice is an informed decision. We explain what the benefit includes, what changes, and what choices remain before anyone signs.",
    verify: ["Use the current election form and required language.", "Explain the effective date and patient rights.", "Document that questions were answered."],
    avoid: ["Do not rush a signature.", "Do not imply that unrelated Medicare coverage ends."],
    escalation: "Send form, benefit, or representative authority questions to admissions or compliance.",
    section: "42 CFR 418.24",
  },
  "election-addendum": {
    title: "Election statement addendum",
    answer: "When requested, the hospice provides an election statement addendum listing conditions, items, services, and medicines the hospice considers unrelated to the terminal illness and related conditions, with a clinical explanation and information about the right to seek review.",
    facts: ["The addendum is tied to the hospice election and plan of care.", "CMS rules set request and delivery timing.", "The patient or representative may request review of unrelated determinations."],
    talkTrack: "The addendum explains what the hospice considers unrelated and why. It gives the patient a clear record and explains how to question that determination.",
    verify: ["Confirm who requested the addendum and when.", "Confirm the current delivery deadline.", "Confirm the clinical explanation and review language."],
    avoid: ["Do not treat the addendum as a generic exclusion list.", "Do not make unrelated determinations from sales information."],
    escalation: "Route content and timing questions to clinical leadership and compliance.",
    section: "42 CFR 418.24(c)",
  },
  "revocation-discharge": {
    title: "Revocation and discharge",
    answer: "A patient or representative may revoke the hospice election at any time. Hospice initiated discharge is limited to defined circumstances and requires current notice, planning, and documentation rules.",
    facts: ["Revocation is the patient’s choice.", "Revocation and hospice discharge are different actions.", "A patient may elect hospice again later if eligible."],
    talkTrack: "The patient remains in control of the election. If they want to stop hospice, the team explains the process, effective date, and how future care will work.",
    verify: ["Identify whether this is revocation, transfer, or discharge.", "Confirm required notice and effective date.", "Coordinate a safe transition of care."],
    avoid: ["Do not threaten discharge to resolve a conflict.", "Do not tell a patient they can never return to hospice."],
    escalation: "Send involuntary discharge, safety, or access concerns to leadership and compliance immediately.",
    section: "42 CFR 418.26",
  },
  "plan-of-care-idg": {
    title: "Plan of care and interdisciplinary group",
    answer: "The hospice interdisciplinary group establishes and updates an individualized plan of care with the patient or representative and the attending physician when applicable. The plan coordinates the services needed to manage the terminal illness and related conditions.",
    facts: ["The plan must reflect patient and family goals.", "The interdisciplinary group reviews and updates the plan.", "Services must be consistent with the plan of care."],
    talkTrack: "Hospice brings the disciplines together around one plan that reflects the patient’s goals. The plan changes as needs change.",
    verify: ["Confirm current goals, needs, and responsible disciplines.", "Confirm review timing and updates.", "Confirm attending physician coordination when applicable."],
    avoid: ["Do not promise a service outside the assessed plan.", "Do not describe the plan as a fixed package."],
    escalation: "Route service frequency or plan conflicts to the interdisciplinary group.",
    section: "42 CFR 418.56",
  },
  "levels-of-care": {
    title: "Hospice levels of care",
    answer: "The Medicare hospice benefit includes routine home care, continuous home care, inpatient respite care, and general inpatient care. The clinical team selects the level based on the patient’s assessed needs and current Medicare requirements.",
    facts: ["Routine home care is the usual level.", "The other levels have distinct purposes and requirements.", "A level of care is not chosen for convenience or sales positioning."],
    talkTrack: "Hospice can adjust the level of support when the patient’s needs meet the requirements. The clinical team assesses the situation and explains the plan.",
    verify: ["Confirm the clinical need and documentation.", "Confirm provider capacity and setting.", "Confirm when the level begins and ends."],
    avoid: ["Do not guarantee continuous or inpatient care.", "Do not describe every crisis as qualifying for a higher level."],
    escalation: "Send any level of care determination to the clinical team.",
    section: "42 CFR 418.302 and Medicare Benefit Policy Manual, Chapter 9",
  },
  "continuous-home-care": {
    title: "Continuous home care",
    answer: "Continuous home care is provided during a period of crisis when predominantly nursing care is needed to achieve palliation or manage acute symptoms so the patient can remain at home. CMS rules define the required amount and mix of care.",
    facts: ["It is for a crisis period, not routine around the clock caregiving.", "Nursing must make up the required portion of care.", "The need and services must be documented."],
    talkTrack: "When symptoms create a crisis at home, the clinical team assesses whether continuous home care is appropriate and builds the support needed to manage that crisis.",
    verify: ["Confirm crisis symptoms and clinical plan.", "Confirm staffing hours and nursing proportion.", "Document when the crisis resolves."],
    avoid: ["Do not call it permanent 24 hour care.", "Do not promise availability before clinical and staffing review."],
    escalation: "Route urgent symptom needs to the hospice clinical line immediately.",
    section: "42 CFR 418.204",
  },
  "general-inpatient-care": {
    title: "General inpatient care",
    answer: "General inpatient care is short term care in an approved inpatient setting for pain control or symptom management that cannot feasibly be provided in another setting. The hospice remains responsible for the plan and coordination.",
    facts: ["The purpose is symptom management, not custodial placement.", "The need must be reassessed and documented.", "The setting must meet Medicare requirements."],
    talkTrack: "If symptoms cannot be managed where the patient is, the clinical team may use short term inpatient care to regain control and plan the next safe setting.",
    verify: ["Confirm symptoms and failed or infeasible interventions.", "Confirm the contracted or approved setting.", "Plan for transition once symptoms are managed."],
    avoid: ["Do not promise an inpatient bed.", "Do not describe general inpatient care as long term residence."],
    escalation: "Send placement and symptom management decisions to the hospice physician and clinical team.",
    section: "42 CFR 418.202 and 418.204",
  },
  "inpatient-respite": {
    title: "Inpatient respite care",
    answer: "Inpatient respite care provides short term relief for caregivers in an approved inpatient setting. Medicare rules limit the number of consecutive respite days and define the settings that may furnish the care.",
    facts: ["Respite supports the caregiver as part of the hospice benefit.", "It is time limited.", "The hospice coordinates the stay and return plan."],
    talkTrack: "Respite gives the caregiver a short period of relief while the patient receives hospice care in an approved setting. The team plans the stay and the return home.",
    verify: ["Confirm caregiver need and patient plan.", "Confirm the approved setting and dates.", "Plan transportation and return care."],
    avoid: ["Do not present respite as long term placement.", "Do not promise a specific facility before confirmation."],
    escalation: "Route availability and eligibility questions to the hospice clinical team.",
    section: "42 CFR 418.204",
  },
  "face-to-face-recertification": {
    title: "Face to face and recertification",
    answer: "For later hospice benefit periods, current Medicare rules require a timely face to face encounter by an authorized hospice physician or nurse practitioner, with the encounter findings used in recertification documentation.",
    facts: ["Timing is tied to the applicable benefit period.", "The encounter and certification have separate documentation requirements.", "Late or incomplete documentation can affect coverage."],
    talkTrack: "The face to face visit gives the certifying team current clinical information for the next benefit period. The hospice schedules it early enough to protect continuity.",
    verify: ["Confirm the benefit period and due date.", "Confirm the authorized practitioner.", "Confirm attestation, findings, and certification completion."],
    avoid: ["Do not treat the encounter as a sales visit.", "Do not assume an encounter automatically proves continued eligibility."],
    escalation: "Send timing or certification gaps to clinical leadership before the deadline.",
    section: "42 CFR 418.22",
  },
  documentation: {
    title: "Documentation conversation guide",
    answer: "Useful hospice documentation tells a coherent clinical story. It connects the terminal illness and related conditions with objective change, symptom burden, function, utilization, goals, and the reasoning behind the plan of care.",
    facts: ["Trend and context are more useful than isolated phrases.", "Documentation should support the service actually provided.", "Sales notes do not establish clinical eligibility."],
    talkTrack: "The strongest record clearly shows what changed, why it matters, what the team observed, and how the plan responds.",
    verify: ["Use objective trends when available.", "Connect observations to the plan and clinical reasoning.", "Confirm dates, authors, and required signatures."],
    avoid: ["Do not copy forward unsupported statements.", "Do not add conclusions that were not made by a clinician."],
    escalation: "Send unclear eligibility narratives or conflicting records to the clinical reviewer.",
    section: "42 CFR 418.22, 418.56, and Medicare Benefit Policy Manual, Chapter 9",
  },
};

const AUDIENCE_PREFIX: Record<PolicyAudience, string> = {
  family: "For a patient or family conversation",
  "referral-source": "For a referral source conversation",
  "sales-rep": "For field preparation",
  "clinical-leader": "For clinical leadership review",
};

function isoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function clean(value: string | undefined, max: number): string {
  return (value || "").replace(/[\u2013\u2014]/g, ",").replace(/\s+/g, " ").trim().slice(0, max);
}

export function buildPolicyBrief(
  topic: PolicyTopic,
  snapshot: CoverageSnapshotLike | null,
  input?: { audience?: PolicyAudience; concern?: string },
) {
  const guide = GUIDANCE[topic];
  const audience = input?.audience && POLICY_AUDIENCES.includes(input.audience) ? input.audience : "referral-source";
  const concern = clean(input?.concern, 400);
  const baseline = !snapshot || isEducationalBaselineSnapshot(snapshot);
  const checkedAt = isoDate(snapshot?.fetchedAt) || new Date().toISOString();
  return {
    topic,
    audience,
    title: guide.title,
    purpose: `${AUDIENCE_PREFIX[audience]}. ${concern ? `Focus on: ${concern}` : "Use the guide to explain the rule clearly and know when to involve a qualified reviewer."}`,
    answer: guide.answer,
    keyFacts: guide.facts,
    talkTrack: guide.talkTrack,
    reviewChecklist: guide.verify,
    whatNotToSay: guide.avoid,
    escalation: guide.escalation,
    sources: [
      { label: guide.section, url: "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-B/part-418", checkedAt },
      { label: "Medicare Benefit Policy Manual, Chapter 9", url: "https://www.cms.gov/regulations-and-guidance/guidance/manuals/downloads/bp102c09.pdf", checkedAt },
    ],
    source: {
      label: baseline ? "Spartan educational baseline with official CMS references" : "CMS Medicare Coverage Database",
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
      ? "Educational guidance with official CMS references. A live CMS coverage snapshot is not currently attached. Confirm the current rule and local process before use. Keep patient specific decisions with qualified clinicians."
      : "Coverage guidance only. Confirm the cited document and keep patient specific decisions with qualified clinicians.",
  };
}
