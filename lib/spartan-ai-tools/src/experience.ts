import type { SpartanAiToolId } from "./registry";

export type AiToolExperienceValue = string | number | boolean | string[];

export type AiToolExperienceFieldKind =
  | "short-text"
  | "long-text"
  | "single-choice"
  | "multi-choice"
  | "number";

export type AiToolExperienceField = {
  key: string;
  label: string;
  kind: AiToolExperienceFieldKind;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: readonly string[];
  allowOther?: boolean;
  defaultValue?: AiToolExperienceValue;
  minimum?: number;
  maximum?: number;
};

export type AiToolExperience = {
  title?: string;
  promise: string;
  submitLabel: string;
  resultTitle: string;
  progressStages: readonly string[];
  fields: readonly AiToolExperienceField[];
  buildInput: (
    values: Record<string, AiToolExperienceValue>,
    context?: AiToolExperienceContext,
  ) => Record<string, unknown>;
};

export type AiToolExperienceContext = {
  contentCatalog?: Array<Record<string, unknown>>;
  interactionHistory?: Array<Record<string, unknown>>;
  usageMetrics?: Array<Record<string, unknown>>;
  userProfile?: Record<string, unknown>;
};

const progress = [
  "Reviewing your context",
  "Checking trusted sources",
  "Building your recommendation",
  "Organizing your field plan",
] as const;

const stringValue = (
  values: Record<string, AiToolExperienceValue>,
  key: string,
) => String(values[key] ?? "").trim();

const numberValue = (
  values: Record<string, AiToolExperienceValue>,
  key: string,
) => Number(values[key] ?? 0);

const listValue = (
  values: Record<string, AiToolExperienceValue>,
  key: string,
) => {
  const value = values[key];
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const humanId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const experiences: Record<SpartanAiToolId, AiToolExperience> = {
  "content-categorizer": {
    promise: "Turn finished content into a clean, consistent library entry.",
    submitLabel: "Categorize content",
    resultTitle: "Recommended classification",
    progressStages: progress,
    fields: [
      { key: "title", label: "Content title", kind: "short-text", required: true, placeholder: "Physician education guide" },
      { key: "content", label: "Content to review", kind: "long-text", required: true, placeholder: "Paste or write the content you want organized." },
      { key: "allowedCategories", label: "Categories this can use", kind: "multi-choice", required: true, allowOther: true, defaultValue: ["Education", "Sales"], options: ["Education", "Sales", "Leadership", "Operations", "Compliance", "Clinical education"] },
      { key: "allowedTags", label: "Useful tags", kind: "multi-choice", allowOther: true, defaultValue: ["Hospice"], options: ["Hospice", "Physician outreach", "SNF", "Objections", "Discovery", "Follow up", "Coaching"] },
    ],
    buildInput: (values) => ({
      title: stringValue(values, "title"),
      content: stringValue(values, "content"),
      allowedCategories: listValue(values, "allowedCategories"),
      allowedTags: listValue(values, "allowedTags"),
    }),
  },
  "content-gap-analyzer": {
    promise: "Find the learning content your team needs next.",
    submitLabel: "Find content gaps",
    resultTitle: "Priority content opportunities",
    progressStages: progress,
    fields: [
      { key: "contentAreas", label: "Content you already have", kind: "multi-choice", required: true, allowOther: true, options: ["Hospice basics", "Discovery", "Objection handling", "Physician outreach", "SNF outreach", "Follow up", "Leadership coaching"] },
      { key: "audiences", label: "Who needs the content", kind: "multi-choice", required: true, allowOther: true, defaultValue: ["New representatives"], options: ["New representatives", "Experienced representatives", "Sales leaders", "Clinical liaisons", "Executive leaders"] },
      { key: "strategicPriorities", label: "Current priorities", kind: "multi-choice", allowOther: true, options: ["Increase referrals", "Improve conversion", "Strengthen discovery", "Handle objections", "Develop leaders", "Improve follow up"] },
      { key: "usageSignal", label: "What are you noticing", kind: "long-text", required: true, placeholder: "Example: The team opens objection content but still struggles to earn the next conversation." },
    ],
    buildInput: (values, context) => {
      const contentAreas = listValue(values, "contentAreas");
      const audience = listValue(values, "audiences")[0] ?? "Sales team";
      return {
        contentCatalog: context?.contentCatalog?.length
          ? context.contentCatalog
          : contentAreas.map((title) => ({ title, audience })),
        usageMetrics: context?.usageMetrics?.length
          ? context.usageMetrics
          : contentAreas.map((title) => ({ title, observation: stringValue(values, "usageSignal") })),
        audiences: listValue(values, "audiences"),
        strategicPriorities: listValue(values, "strategicPriorities"),
      };
    },
  },
  "content-generator": {
    promise: "Build polished field content from a clear creative brief.",
    submitLabel: "Create content",
    resultTitle: "Field ready content",
    progressStages: progress,
    fields: [
      { key: "brief", label: "What should this create", kind: "long-text", required: true, placeholder: "Describe the message, situation, and outcome you need." },
      { key: "audience", label: "Audience", kind: "single-choice", required: true, allowOther: true, options: ["Hospice sales representatives", "Physicians", "Hospital teams", "SNF teams", "Families", "Hospice leaders"] },
      { key: "format", label: "Format", kind: "single-choice", required: true, allowOther: true, options: ["Field guide", "Email", "Talking points", "Training outline", "One page brief", "Social post"] },
      { key: "tone", label: "Tone", kind: "single-choice", required: true, allowOther: true, defaultValue: "Clear and practical", options: ["Clear and practical", "Warm and human", "Direct and confident", "Educational", "Executive"] },
      { key: "sourceNotes", label: "Approved facts or source notes", kind: "long-text", placeholder: "Optional. Add verified facts the draft should use." },
    ],
    buildInput: (values) => ({
      brief: stringValue(values, "brief"),
      audience: stringValue(values, "audience"),
      format: stringValue(values, "format"),
      tone: stringValue(values, "tone"),
      evidence: stringValue(values, "sourceNotes") ? [{ source: "User supplied approved notes", note: stringValue(values, "sourceNotes") }] : [],
    }),
  },
  "content-recommender": {
    promise: "Recommend the most useful Spartan resource for the goal in front of you.",
    submitLabel: "Recommend resources",
    resultTitle: "Recommended next resources",
    progressStages: progress,
    fields: [
      { key: "role", label: "Your role", kind: "single-choice", required: true, allowOther: true, options: ["Hospice sales representative", "Sales leader", "Clinical liaison", "Executive leader", "Trainer"] },
      { key: "goal", label: "What do you need to improve now", kind: "single-choice", required: true, allowOther: true, options: ["Discovery", "Objection handling", "Physician outreach", "SNF outreach", "Follow up", "Leadership", "Planning"] },
      { key: "timeAvailable", label: "Time available", kind: "single-choice", required: true, defaultValue: "10 minutes", options: ["5 minutes", "10 minutes", "20 minutes", "30 minutes or more"] },
      { key: "contentInterests", label: "Preferred learning formats", kind: "multi-choice", required: true, allowOther: true, defaultValue: ["Field guide"], options: ["Field guide", "Article", "Audio", "Practice", "Calculator", "Template"] },
    ],
    buildInput: (values, context) => {
      const goal = stringValue(values, "goal");
      const formats = listValue(values, "contentInterests");
      return {
        userProfile: { ...context?.userProfile, role: stringValue(values, "role"), focus: goal, timeAvailable: stringValue(values, "timeAvailable") },
        contentCatalog: context?.contentCatalog?.length
          ? context.contentCatalog
          : formats.map((format, index) => ({ id: `${humanId(goal)}-${index + 1}`, title: `${goal} ${format}`, topics: [goal], format })),
        interactionHistory: context?.interactionHistory ?? [],
      };
    },
  },
  "development-plan-generator": {
    promise: "Turn an honest skill review into a measurable growth plan.",
    submitLabel: "Build development plan",
    resultTitle: "Your development plan",
    progressStages: progress,
    fields: [
      { key: "focusAreas", label: "Skills to develop", kind: "multi-choice", required: true, allowOther: true, options: ["Discovery", "Objection handling", "Account planning", "Follow up", "Clinical confidence", "Time management", "Leadership"] },
      { key: "currentConfidence", label: "Current confidence", kind: "single-choice", required: true, defaultValue: "Developing", options: ["Needs support", "Developing", "Confident"] },
      { key: "goals", label: "Desired outcomes", kind: "multi-choice", required: true, allowOther: true, options: ["Earn more next meetings", "Increase qualified referrals", "Improve conversion", "Build clinical credibility", "Lead with consistency"] },
      { key: "timeHorizon", label: "Plan length", kind: "single-choice", required: true, defaultValue: "90 days", options: ["30 days", "60 days", "90 days", "6 months"] },
      { key: "availableResources", label: "Support available", kind: "multi-choice", allowOther: true, options: ["Weekly manager coaching", "Field ride alongs", "Role play practice", "Spartan Coach", "Peer mentoring"] },
    ],
    buildInput: (values) => {
      const score = stringValue(values, "currentConfidence") === "Confident" ? 85 : stringValue(values, "currentConfidence") === "Developing" ? 65 : 40;
      return {
        assessmentData: Object.fromEntries(listValue(values, "focusAreas").map((area) => [humanId(area), score])),
        goals: listValue(values, "goals"),
        timeHorizon: stringValue(values, "timeHorizon"),
        availableResources: listValue(values, "availableResources"),
      };
    },
  },
  "email-optimizer": {
    promise: "Create a useful email that sounds human and earns a clear next step.",
    submitLabel: "Create email options",
    resultTitle: "Email options",
    progressStages: progress,
    fields: [
      { key: "prospectType", label: "Recipient type", kind: "single-choice", required: true, allowOther: true, options: ["Physician", "Hospital case manager", "SNF leader", "Assisted living leader", "Home health leader", "Community partner"] },
      { key: "situation", label: "What happened", kind: "long-text", required: true, placeholder: "Describe the meeting, conversation, or reason for reaching out." },
      { key: "objective", label: "Desired next step", kind: "single-choice", required: true, allowOther: true, options: ["Schedule a meeting", "Continue the conversation", "Share education", "Thank them", "Reconnect", "Confirm next steps"] },
      { key: "tone", label: "Tone", kind: "single-choice", required: true, defaultValue: "consultative", options: ["warm", "concise", "educational", "consultative", "direct"] },
      { key: "previousInteraction", label: "Important relationship context", kind: "long-text", placeholder: "Optional. Add only what will make the email more personal and relevant." },
      { key: "includeSequence", label: "Follow up plan", kind: "single-choice", required: true, defaultValue: "Include a short sequence", options: ["Include a short sequence", "One email only"] },
    ],
    buildInput: (values) => ({
      prospectType: stringValue(values, "prospectType"),
      situation: stringValue(values, "situation"),
      objective: stringValue(values, "objective"),
      tone: stringValue(values, "tone"),
      previousInteraction: stringValue(values, "previousInteraction") || undefined,
      accountHistory: [],
      includeSequence: stringValue(values, "includeSequence") !== "One email only",
    }),
  },
  "family-meeting-simulator": {
    promise: "Prepare for a difficult family conversation with empathy and structure.",
    submitLabel: "Build practice scenario",
    resultTitle: "Family meeting practice",
    progressStages: progress,
    fields: [
      { key: "scenario", label: "Meeting situation", kind: "single-choice", required: true, allowOther: true, options: ["Family is divided about hospice", "Family says they are not ready", "One decision maker dominates", "Family distrusts the care team", "Goals of care are unclear"] },
      { key: "familyDynamics", label: "Family dynamics", kind: "multi-choice", required: true, allowOther: true, options: ["Siblings disagree", "Decision maker is overwhelmed", "Family avoids the topic", "Different levels of understanding", "Strong emotions are present"] },
      { key: "culturalBackground", label: "Cultural and personal considerations", kind: "multi-choice", required: true, allowOther: true, options: ["Ask rather than assume preferences", "Include a faith leader", "Use an interpreter", "Respect collective decision making", "Clarify who the family trusts"] },
      { key: "difficulty", label: "Practice difficulty", kind: "single-choice", required: true, defaultValue: "intermediate", options: ["foundational", "intermediate", "advanced"] },
    ],
    buildInput: (values) => ({
      scenario: stringValue(values, "scenario"),
      familyDynamics: listValue(values, "familyDynamics").join("; "),
      culturalBackground: listValue(values, "culturalBackground").join("; "),
      difficulty: stringValue(values, "difficulty"),
    }),
  },
  "microlearning-generator": {
    promise: "Create a focused lesson that can be completed in minutes.",
    submitLabel: "Create microlearning",
    resultTitle: "Your learning challenge",
    progressStages: progress,
    fields: [
      { key: "difficulty", label: "Difficulty", kind: "single-choice", required: true, defaultValue: "intermediate", options: ["foundational", "intermediate", "advanced"] },
      { key: "category", label: "Skill category", kind: "single-choice", required: true, allowOther: true, options: ["Discovery", "Objection handling", "Physician outreach", "SNF outreach", "Follow up", "Clinical confidence", "Leadership"] },
      { key: "previousTopics", label: "Topics already practiced", kind: "multi-choice", allowOther: true, options: ["Discovery questions", "Value language", "Not ready objection", "Referral follow up", "Account planning"] },
    ],
    buildInput: (values) => ({
      userId: "current-user",
      difficulty: stringValue(values, "difficulty"),
      category: stringValue(values, "category"),
      previousTopics: listValue(values, "previousTopics"),
    }),
  },
  "territory-account-discovery": {
    promise: "Turn a territory into a focused account search.",
    submitLabel: "Find territory accounts",
    resultTitle: "Territory opportunities",
    progressStages: ["Confirming your territory", "Filtering facility types", "Organizing account opportunities"],
    fields: [
      { key: "zipCodes", label: "ZIP codes", kind: "short-text", required: true, placeholder: "Example: 32937, 32940", helper: "Enter one or more ZIP codes separated by commas." },
      { key: "radiusMiles", label: "Search radius", kind: "single-choice", required: true, defaultValue: "15", options: ["5", "10", "15", "25", "50"] },
      { key: "facilityTypes", label: "Facility types", kind: "multi-choice", required: true, allowOther: true, options: ["Hospital", "Skilled nursing facility", "Assisted living", "Physician practice", "Home health", "Senior community"] },
    ],
    buildInput: (values) => ({
      zipCodes: listValue(values, "zipCodes"),
      radiusMiles: Number(stringValue(values, "radiusMiles")),
      facilityTypes: listValue(values, "facilityTypes").map((item) => item.toLowerCase()),
      facilities: [],
    }),
  },
  "admission-eligibility": {
    promise: "Organize deidentified facts against educational admission criteria for qualified review.",
    submitLabel: "Build criteria educator",
    resultTitle: "Educational criteria review",
    progressStages: progress,
    fields: [
      { key: "diagnosis", label: "Diagnosis category", kind: "single-choice", required: true, allowOther: true, options: ["Cancer", "Heart disease", "Pulmonary disease", "Dementia", "Neurologic disease", "Renal disease", "Liver disease"] },
      { key: "patientCondition", label: "Deidentified condition summary", kind: "long-text", required: true, placeholder: "Describe the current condition without names, dates, record numbers, or contact details." },
      { key: "functionStatus", label: "Functional status", kind: "multi-choice", required: true, allowOther: true, options: ["Needs help with bathing", "Needs help with dressing", "Needs help with transfers", "Limited mobility", "Mostly chair or bed bound", "Reduced intake"] },
      { key: "comorbidities", label: "Comorbidity categories", kind: "multi-choice", required: true, allowOther: true, options: ["Heart disease", "Pulmonary disease", "Renal disease", "Dementia", "Diabetes", "Cancer", "Stroke history"] },
      { key: "recentHospitalizations", label: "Recent utilization summary", kind: "long-text", required: true, placeholder: "Summarize recent emergency, hospital, or high intensity care without identifiers." },
    ],
    buildInput: (values) => ({
      diagnosis: stringValue(values, "diagnosis"),
      patientCondition: stringValue(values, "patientCondition"),
      functionStatus: listValue(values, "functionStatus").join("; "),
      comorbidities: listValue(values, "comorbidities"),
      recentHospitalizations: stringValue(values, "recentHospitalizations"),
    }),
  },
  "documentation-gap-analyzer": {
    promise: "Find what a qualified reviewer still needs to see in deidentified documentation.",
    submitLabel: "Analyze documentation gaps",
    resultTitle: "Documentation review priorities",
    progressStages: progress,
    fields: [
      { key: "diagnosis", label: "Diagnosis category", kind: "single-choice", required: true, allowOther: true, options: ["Cancer", "Heart disease", "Pulmonary disease", "Dementia", "Neurologic disease", "Renal disease", "Liver disease"] },
      { key: "clinicalSummary", label: "Deidentified clinical summary", kind: "long-text", required: true, placeholder: "Summarize the documented facts without patient identifiers." },
      { key: "criteria", label: "Documentation categories to review", kind: "multi-choice", required: true, allowOther: true, options: ["Diagnosis support", "Functional decline", "Nutritional decline", "Recent utilization", "Comorbidities", "Goals and plan of care"] },
      { key: "documentedEvidence", label: "Evidence already documented", kind: "multi-choice", allowOther: true, options: ["Functional measurements", "Weight or intake changes", "Utilization history", "Disease progression", "Comorbidity impact", "Caregiver observations"] },
    ],
    buildInput: (values) => ({
      clinicalData: { diagnosis: stringValue(values, "diagnosis"), summary: stringValue(values, "clinicalSummary") },
      criteria: listValue(values, "criteria").map((criterion) => ({ criterion })),
      documentedEvidence: listValue(values, "documentedEvidence").map((evidence) => ({ evidence })),
    }),
  },
  "lcd-policy-sales-playbook": {
    promise: "Translate a verified policy update into compliant field education.",
    submitLabel: "Build policy playbook",
    resultTitle: "Policy field playbook",
    progressStages: progress,
    fields: [
      { key: "policyTitle", label: "Verified policy update", kind: "short-text", required: true, placeholder: "Enter the approved policy title or identifier." },
      { key: "policySummary", label: "What changed", kind: "long-text", required: true, placeholder: "Summarize the verified change and why it matters." },
      { key: "affectedAudiences", label: "Who needs this guidance", kind: "multi-choice", required: true, allowOther: true, options: ["Hospice sales teams", "Clinical liaisons", "Admissions teams", "Hospice leaders", "Referral partners"] },
      { key: "source", label: "Verified source", kind: "short-text", required: true, placeholder: "CMS source title, identifier, or approved internal source." },
    ],
    buildInput: (values) => ({
      policyChange: { title: stringValue(values, "policyTitle"), summary: stringValue(values, "policySummary") },
      affectedAudiences: listValue(values, "affectedAudiences"),
      evidence: [{ source: stringValue(values, "source"), citation: stringValue(values, "policyTitle") }],
    }),
  },
  "medical-record-lcd-verifier": {
    title: "Deidentified Documentation Review",
    promise: "Review deidentified documentation against current educational evidence boundaries.",
    submitLabel: "Review documentation",
    resultTitle: "Deidentified evidence review",
    progressStages: progress,
    fields: [
      { key: "recordText", label: "Deidentified documentation summary", kind: "long-text", required: true, placeholder: "Enter only deidentified facts. Do not include names, dates, record numbers, contact details, or documents." },
      { key: "reviewFocus", label: "What should the reviewer examine", kind: "multi-choice", required: true, allowOther: true, options: ["Diagnosis support", "Functional decline", "Nutritional decline", "Recent utilization", "Comorbidity impact", "Missing evidence"] },
    ],
    buildInput: (values) => ({
      recordText: `${stringValue(values, "recordText")}\n\nReview focus: ${listValue(values, "reviewFocus").join(", ")}`,
    }),
  },
  "medicare-lcd-advisor": {
    promise: "Answer a focused educational LCD question with evidence and review boundaries.",
    submitLabel: "Build LCD guidance",
    resultTitle: "Educational LCD guidance",
    progressStages: progress,
    fields: [
      { key: "diagnosis", label: "Diagnosis category", kind: "single-choice", required: true, allowOther: true, options: ["Cancer", "Heart disease", "Pulmonary disease", "Dementia", "Neurologic disease", "Renal disease", "Liver disease"] },
      { key: "question", label: "Question", kind: "single-choice", required: true, allowOther: true, options: ["What documentation categories should a qualified reviewer examine", "What decline indicators are commonly relevant", "What evidence is still missing", "What should be verified in the current policy"] },
      { key: "context", label: "Optional deidentified context", kind: "long-text", placeholder: "Add only the context needed to make the educational answer useful." },
    ],
    buildInput: (values) => ({
      diagnosis: stringValue(values, "diagnosis"),
      question: stringValue(values, "question"),
      context: stringValue(values, "context") || undefined,
    }),
  },
};

export function getAiToolExperience(toolId: SpartanAiToolId): AiToolExperience {
  return experiences[toolId];
}

export function initialAiToolExperienceValues(
  toolId: SpartanAiToolId,
): Record<string, AiToolExperienceValue> {
  return Object.fromEntries(
    experiences[toolId].fields.map((field) => [
      field.key,
      field.defaultValue ?? (field.kind === "multi-choice" ? [] : ""),
    ]),
  );
}

export function hydrateAiToolExperienceValues(
  toolId: SpartanAiToolId,
  source: Record<string, unknown>,
): Record<string, AiToolExperienceValue> {
  const values = initialAiToolExperienceValues(toolId);
  for (const field of experiences[toolId].fields) {
    const value = source[field.key];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      (Array.isArray(value) && value.every((item) => typeof item === "string"))
    ) {
      values[field.key] = value as AiToolExperienceValue;
    }
  }
  return values;
}

export function buildAiToolExperienceInput(
  toolId: SpartanAiToolId,
  values: Record<string, AiToolExperienceValue>,
  context?: AiToolExperienceContext,
): Record<string, unknown> {
  return experiences[toolId].buildInput(values, context);
}
