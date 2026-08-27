import type { NpiResult } from "./npiLookup";

export const ACCOUNT_TYPES = ["physician-practice", "hospital", "snf", "assisted-living", "home-health", "community", "other"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export type AccountBriefInput = {
  provider: NpiResult;
  meetingPurpose?: string;
  relationshipStage?: "new" | "developing" | "active" | "reengage";
  knownContext?: string;
  accountType?: AccountType;
  knownBarrier?: string;
  stakeholderRole?: string;
  desiredCommitment?: string;
};

export type AccountBrief = {
  headline: string;
  verifiedFacts: Array<{ label: string; value: string }>;
  meetingObjective: string;
  opening: string;
  discoveryQuestions: string[];
  preparation: string[];
  accountLens: string;
  meetingObjective: string;
  opening: string;
  discoveryQuestions: string[];
  valueHypotheses: string[];
  watchouts: string[];
  preparation: string[];
  followUpMessage: string;
  thirtyDayPlan: Array<{ timing: string; action: string; outcome: string }>;
  nextMove: string;
  limitations: string[];
  source: NpiResult["source"];
};

function clean(value: string | undefined, max: number): string {
  return (value || "").replace(/[\u2013\u2014]/g, ",").replace(/\s+/g, " ").trim().slice(0, max);
}

function audience(provider: NpiResult): string {
  const taxonomy = provider.taxonomies.join(" ").toLowerCase();
  if (taxonomy.includes("internal medicine") || taxonomy.includes("family medicine")) return "primary care practice";
  if (taxonomy.includes("nursing facility") || taxonomy.includes("skilled nursing")) return "post acute care team";
  if (taxonomy.includes("oncology")) return "oncology practice";
  if (taxonomy.includes("cardiology")) return "cardiology practice";
  if (taxonomy.includes("nephrology")) return "nephrology practice";
  if (taxonomy.includes("hospital")) return "hospital team";
  return provider.enumerationType === "NPI-2" ? "organization" : "practice";
}

export function buildAccountBrief(input: AccountBriefInput): AccountBrief {
  const provider = input.provider;
  const purpose = clean(input.meetingPurpose, 240) || "Understand how this team approaches serious illness conversations and what a useful hospice partner looks like to them.";
  const context = clean(input.knownContext, 500);
  const stage = input.relationshipStage || "new";
  const group = audience(provider);
  return (value || "").replace(/[\u2013\u2014]/g, ",").replace(/[{}<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

function inferAccountType(provider: NpiResult): AccountType {
  const taxonomy = provider.taxonomies.join(" ").toLowerCase();
  if (taxonomy.includes("hospital")) return "hospital";
  if (taxonomy.includes("skilled nursing") || taxonomy.includes("nursing facility")) return "snf";
  if (taxonomy.includes("assisted living")) return "assisted-living";
  if (taxonomy.includes("home health")) return "home-health";
  if (provider.enumerationType === "NPI-1" || taxonomy.includes("medicine") || taxonomy.includes("physician")) return "physician-practice";
  return provider.enumerationType === "NPI-2" ? "community" : "other";
}

const ACCOUNT_PLAYBOOKS: Record<AccountType, {
  lens: string;
  questions: string[];
  value: string[];
  watchouts: string[];
}> = {
  "physician-practice": {
    lens: "Protect physician time, make serious illness conversations easier, and create a referral process the practice can trust.",
    questions: ["Which changes make your team think a hospice conversation may be appropriate?", "Where does the current consult or referral process create extra work?", "How do you want updates delivered after a consult?", "Who owns follow through when the physician raises hospice?"],
    value: ["A clear consult path with one accountable contact.", "Brief education that helps staff recognize when to ask for a clinical review.", "Communication matched to the practice’s preferred channel and cadence."],
    watchouts: ["Do not lead with brochures or generic eligibility lists.", "Do not imply that a referral removes the physician from the relationship."],
  },
  hospital: {
    lens: "Understand discharge pressure, consult timing, handoff ownership, and how the hospice can reduce avoidable friction across departments.",
    questions: ["Where in the stay are hospice conversations happening too late?", "What slows a safe transition once a consult is ordered?", "Which teams need a consistent handoff standard?", "What information would help case management trust the next step?"],
    value: ["A defined consult and handoff workflow.", "Rapid ownership of the next action after referral.", "Closed loop communication to case management and the attending team."],
    watchouts: ["Do not promise discharge timing outside operational control.", "Do not bypass case management, compliance, or patient choice."],
  },
  snf: {
    lens: "Focus on early recognition, family readiness, after hours support, staff education, and a partnership that reduces avoidable disruption.",
    questions: ["Which resident changes are hardest for staff and families to interpret?", "When do goals of care conversations usually begin?", "What happens after hours when symptoms or family concerns increase?", "What would useful hospice education look like for this team?"],
    value: ["Short education tied to the facility’s real workflow.", "Clear escalation and after hours communication.", "Family support that complements the facility team."],
    watchouts: ["Do not treat census as the objective of the conversation.", "Do not imply hospice replaces facility responsibilities."],
  },
  "assisted-living": {
    lens: "Learn how staff identify change, communicate with families and physicians, and keep residents supported in their chosen setting.",
    questions: ["What changes usually cause the most uncertainty for staff?", "Who leads family communication when needs increase?", "What support helps residents remain safely in the community?", "How should the hospice communicate with your wellness team?"],
    value: ["A simple recognition and escalation pathway.", "Family education coordinated with community leadership.", "Consistent communication that respects the community’s role."],
    watchouts: ["Do not promise that every resident can remain in place.", "Do not create a parallel process that excludes community staff."],
  },
  "home-health": {
    lens: "Clarify transitions when restorative goals change, protect continuity, and make warm handoffs easier for clinicians and families.",
    questions: ["What signals tell your clinicians the current plan may no longer be enough?", "How are goals of care concerns escalated today?", "What makes a hospice handoff feel safe to your team?", "How should both organizations close the loop after a consult?"],
    value: ["A respectful transition path that protects continuity.", "Education on when to request a hospice clinical review.", "Closed loop updates after the patient’s decision."],
    watchouts: ["Do not position hospice as a competitor for every declining patient.", "Do not make eligibility claims from home health documentation alone."],
  },
  community: {
    lens: "Understand the organization’s role, audience, and trust responsibilities before proposing any hospice related action.",
    questions: ["Who does this organization serve and what questions come up most often?", "Where are people getting stuck when they seek serious illness support?", "What education would be useful without becoming promotional?", "Who should approve resources before they are shared?"],
    value: ["Accurate education in plain language.", "A named contact for questions and warm navigation.", "Resources reviewed for the audience and setting."],
    watchouts: ["Do not turn community education into referral pressure.", "Do not collect patient information in a public outreach workflow."],
  },
  other: {
    lens: "Use discovery to understand this account’s workflow, priorities, and decision structure before proposing value.",
    questions: ["What role does your team play in serious illness conversations?", "Where does the current process break down?", "What would a useful hospice partner do consistently?", "Who needs to agree on the next step?"],
    value: ["A process matched to the account’s actual role.", "One accountable contact and one defined next step.", "Education based on the account’s stated needs."],
    watchouts: ["Do not assume the account’s priorities from its name alone.", "Do not overstate what the public registry proves."],
  },
};

export function buildAccountBrief(input: AccountBriefInput): AccountBrief {
  const provider = input.provider;
  const accountType = input.accountType && ACCOUNT_TYPES.includes(input.accountType) ? input.accountType : inferAccountType(provider);
  const playbook = ACCOUNT_PLAYBOOKS[accountType];
  const purpose = clean(input.meetingPurpose, 240) || "Understand the account’s current process and earn agreement on one useful next step.";
  const context = clean(input.knownContext, 500);
  const barrier = clean(input.knownBarrier, 240);
  const stakeholder = clean(input.stakeholderRole, 120);
  const desiredCommitment = clean(input.desiredCommitment, 180) || "Agree on the owner and date for the next action.";
  const stage = input.relationshipStage || "new";
  const location = [provider.city, provider.state].filter(Boolean).join(", ");
  const verifiedFacts = [
    { label: "Provider", value: provider.name },
    provider.credential ? { label: "Credential", value: provider.credential } : null,
    provider.taxonomy ? { label: "Primary specialty", value: provider.taxonomy } : null,
    location ? { label: "Location", value: location } : null,
    { label: "NPI", value: provider.npi },
    provider.status ? { label: "Registry status", value: provider.status === "A" ? "Active" : provider.status } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  const stageOpenings: Record<NonNullable<AccountBriefInput["relationshipStage"]>, string> = {
    new: `I wanted to learn how your ${group} handles serious illness conversations today and where a hospice partner can make the work easier for your team.`,
    developing: "I appreciate the conversations we have already started. I want to make sure the next step is useful to your team, not another generic follow up.",
    active: "I want to check that our partnership is delivering what your team actually needs and address anything that could work better.",
    reengage: "It has been a while since we connected. I would rather understand what changed than make assumptions, and I want to earn a useful next conversation.",
  };

  return {
    headline: `${provider.name} meeting brief`,
    verifiedFacts,
    meetingObjective: purpose,
    opening: stageOpenings[stage],
    discoveryQuestions: [
      "When a patient is declining, what usually makes the hospice conversation easier or harder for your team?",
      "Where does the current referral or consult process create extra work?",
      "What does strong communication from a hospice partner look like here?",
      "Who else should be part of this conversation so the process works after today?",
      "What would make the next thirty days feel like progress to you?",
    ],
    preparation: [
      `Confirm the role and priorities of the ${group} before the meeting.`,
      "Bring one relevant educational resource, not a pile of brochures.",
      "Choose one clear next step you can complete within twenty four hours.",
      ...(context ? [`Use the known context as a question to validate: ${context}`] : []),
    ],
    nextMove: "Leave with one named owner, one specific commitment, and a date for the next conversation.",
    limitations: [
      "NPPES verifies public provider identity and taxonomy. It does not show referral volume, relationship strength, or willingness to refer.",
      "Confirm details directly with the provider before using them for outreach decisions.",
    new: `I wanted to learn how your team handles serious illness conversations today and where a hospice partner could make the work easier.`,
    developing: "I appreciate the conversations we have started. I want to make the next step useful to your team and specific to what you are trying to improve.",
    active: "I want to make sure our partnership is delivering what your team needs and address anything that could work better.",
    reengage: "It has been a while since we connected. I would rather understand what changed than make assumptions, and I want to earn a useful next conversation.",
  };

  const followUp = `Thank you for the conversation today. I heard that ${barrier || "a clear and dependable process"} matters most. I will ${desiredCommitment.toLowerCase()} and follow up with the agreed owner and timing. If I missed anything, please tell me.`;

  return {
    headline: `${provider.name} account plan`,
    verifiedFacts,
    accountLens: playbook.lens,
    meetingObjective: purpose,
    opening: stageOpenings[stage],
    discoveryQuestions: [
      ...playbook.questions,
      ...(barrier ? [`You mentioned ${barrier.toLowerCase()}. What would meaningful improvement look like?`] : []),
      ...(stakeholder ? [`From your role in ${stakeholder}, what would make this partnership easier to trust?`] : []),
      "What would make the next thirty days feel like real progress to your team?",
    ].slice(0, 6),
    valueHypotheses: playbook.value,
    watchouts: playbook.watchouts,
    preparation: [
      `Review the public NPPES record and confirm the ${accountType.replace(/-/g, " ")} account type in the room.`,
      "Bring one relevant educational resource tied to a stated need.",
      `Prepare to ask for this commitment: ${desiredCommitment}`,
      ...(context ? [`Validate this context instead of assuming it is current: ${context}`] : []),
    ],
    followUpMessage: followUp,
    thirtyDayPlan: [
      { timing: "Within 24 hours", action: "Send the promised follow up and document the agreed owner.", outcome: "The account sees immediate reliability." },
      { timing: "Within 7 days", action: "Deliver one useful resource or workflow improvement tied to discovery.", outcome: "The relationship advances through value, not repetition." },
      { timing: "Within 30 days", action: "Review what changed, what remains difficult, and agree on the next measurable step.", outcome: "The account has a visible reason to continue the partnership." },
    ],
    nextMove: desiredCommitment,
    limitations: [
      "NPPES verifies public provider identity and taxonomy. It does not show referral volume, decision authority, relationship strength, or willingness to refer.",
      "Confirm public details and every coaching assumption directly with the account before acting.",
    ],
    source: provider.source,
  };
}
