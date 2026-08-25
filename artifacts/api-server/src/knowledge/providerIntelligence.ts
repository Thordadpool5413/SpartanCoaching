import type { NpiResult } from "./npiLookup";

export type AccountBriefInput = {
  provider: NpiResult;
  meetingPurpose?: string;
  relationshipStage?: "new" | "developing" | "active" | "reengage";
  knownContext?: string;
};

export type AccountBrief = {
  headline: string;
  verifiedFacts: Array<{ label: string; value: string }>;
  meetingObjective: string;
  opening: string;
  discoveryQuestions: string[];
  preparation: string[];
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
    ],
    source: provider.source,
  };
}
