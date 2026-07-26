import type { ZodType } from "zod";
import {
  inputSchema as admissionInput,
  outputSchema as admissionOutput,
} from "./tools/admission-eligibility/schema";
import {
  buildPrompt as admissionPrompt,
  SYSTEM_PROMPT as admissionSystem,
} from "./tools/admission-eligibility/prompt";
import {
  inputSchema as categorizerInput,
  outputSchema as categorizerOutput,
} from "./tools/content-categorizer/schema";
import {
  buildPrompt as categorizerPrompt,
  SYSTEM_PROMPT as categorizerSystem,
} from "./tools/content-categorizer/prompt";
import {
  inputSchema as gapInput,
  outputSchema as gapOutput,
} from "./tools/content-gap-analyzer/schema";
import {
  buildPrompt as gapPrompt,
  SYSTEM_PROMPT as gapSystem,
} from "./tools/content-gap-analyzer/prompt";
import {
  inputSchema as generatorInput,
  outputSchema as generatorOutput,
} from "./tools/content-generator/schema";
import {
  buildPrompt as generatorPrompt,
  SYSTEM_PROMPT as generatorSystem,
} from "./tools/content-generator/prompt";
import {
  inputSchema as recommenderInput,
  outputSchema as recommenderOutput,
} from "./tools/content-recommender/schema";
import {
  buildPrompt as recommenderPrompt,
  SYSTEM_PROMPT as recommenderSystem,
} from "./tools/content-recommender/prompt";
import {
  inputSchema as developmentInput,
  outputSchema as developmentOutput,
} from "./tools/development-plan-generator/schema";
import {
  buildPrompt as developmentPrompt,
  SYSTEM_PROMPT as developmentSystem,
} from "./tools/development-plan-generator/prompt";
import {
  inputSchema as documentationInput,
  outputSchema as documentationOutput,
} from "./tools/documentation-gap-analyzer/schema";
import {
  buildPrompt as documentationPrompt,
  SYSTEM_PROMPT as documentationSystem,
} from "./tools/documentation-gap-analyzer/prompt";
import {
  inputSchema as emailInput,
  outputSchema as emailOutput,
} from "./tools/email-optimizer/schema";
import {
  buildPrompt as emailPrompt,
  SYSTEM_PROMPT as emailSystem,
} from "./tools/email-optimizer/prompt";
import {
  inputSchema as familyInput,
  outputSchema as familyOutput,
} from "./tools/family-meeting-simulator/schema";
import {
  buildPrompt as familyPrompt,
  SYSTEM_PROMPT as familySystem,
} from "./tools/family-meeting-simulator/prompt";
import {
  inputSchema as playbookInput,
  outputSchema as playbookOutput,
} from "./tools/lcd-policy-sales-playbook/schema";
import {
  buildPrompt as playbookPrompt,
  SYSTEM_PROMPT as playbookSystem,
} from "./tools/lcd-policy-sales-playbook/prompt";
import {
  inputSchema as recordInput,
  outputSchema as recordOutput,
} from "./tools/medical-record-lcd-verifier/schema";
import {
  buildPrompt as recordPrompt,
  SYSTEM_PROMPT as recordSystem,
} from "./tools/medical-record-lcd-verifier/prompt";
import {
  inputSchema as advisorInput,
  outputSchema as advisorOutput,
} from "./tools/medicare-lcd-advisor/schema";
import {
  buildPrompt as advisorPrompt,
  SYSTEM_PROMPT as advisorSystem,
} from "./tools/medicare-lcd-advisor/prompt";
import {
  inputSchema as learningInput,
  outputSchema as learningOutput,
} from "./tools/microlearning-generator/schema";
import {
  buildPrompt as learningPrompt,
  SYSTEM_PROMPT as learningSystem,
} from "./tools/microlearning-generator/prompt";
import {
  inputSchema as territoryInput,
  outputSchema as territoryOutput,
} from "./tools/territory-account-discovery/schema";

export type SpartanAiToolId =
  | "admission-eligibility"
  | "content-categorizer"
  | "content-gap-analyzer"
  | "content-generator"
  | "content-recommender"
  | "development-plan-generator"
  | "documentation-gap-analyzer"
  | "email-optimizer"
  | "family-meeting-simulator"
  | "lcd-policy-sales-playbook"
  | "medical-record-lcd-verifier"
  | "medicare-lcd-advisor"
  | "microlearning-generator"
  | "territory-account-discovery";

export type AiToolCategory =
  "Sales" | "Content" | "Learning" | "Clinical" | "Compliance";
export type AiToolPermission = "field-kit" | "clinical:use";
export type AiToolFieldKind =
  | "string"
  | "text"
  | "number"
  | "boolean"
  | "string-list"
  | "json"
  | "json-list"
  | "select";

export interface AiToolField {
  key: string;
  label: string;
  kind: AiToolFieldKind;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface AiToolSpec {
  id: SpartanAiToolId;
  name: string;
  description: string;
  category: AiToolCategory;
  version: "1.0.0";
  containsPhi: boolean;
  permission: AiToolPermission;
  featureFlag: string;
  webPath: string;
  mobilePath: string;
  fields: readonly AiToolField[];
  exampleInput: Record<string, unknown>;
  inputSchema: ZodType;
  outputSchema: ZodType;
  systemPrompt: string;
  buildPrompt: (input: never) => string;
  deterministic?: boolean;
  safetyWarnings: readonly string[];
}

const clinicalWarnings = [
  "Educational decision support only; qualified clinical review is required.",
  "Do not use this output as a diagnosis, prognosis, coverage determination, or autonomous admission decision.",
] as const;

const fields = (...items: AiToolField[]) => items;
const text = (key: string, label: string, required = true): AiToolField => ({
  key,
  label,
  kind: "text",
  required,
});
const string = (key: string, label: string, required = true): AiToolField => ({
  key,
  label,
  kind: "string",
  required,
});
const list = (key: string, label: string, required = true): AiToolField => ({
  key,
  label,
  kind: "string-list",
  required,
  placeholder: "One item per line",
});
const json = (key: string, label: string, required = true): AiToolField => ({
  key,
  label,
  kind: "json",
  required,
  placeholder: '{"key":"value"}',
});
const jsonList = (
  key: string,
  label: string,
  required = true,
): AiToolField => ({
  key,
  label,
  kind: "json-list",
  required,
  placeholder: '[{"key":"value"}]',
});

export const SPARTAN_AI_TOOLS: readonly AiToolSpec[] = [
  {
    id: "content-categorizer",
    name: "Content Categorizer",
    description:
      "Classify training and sales content against an allowed taxonomy.",
    category: "Content",
    version: "1.0.0",
    containsPhi: false,
    permission: "field-kit",
    featureFlag: "AI_TOOL_CONTENT_CATEGORIZER",
    webPath: "/tools/ai/content-categorizer",
    mobilePath: "/ai-tools/content-categorizer",
    fields: fields(
      text("title", "Title"),
      text("content", "Content"),
      list("allowedCategories", "Allowed categories"),
      list("allowedTags", "Allowed tags", false),
    ),
    exampleInput: {
      title: "Physician education guide",
      content: "A short guide to timely hospice conversations.",
      allowedCategories: ["Education", "Sales"],
      allowedTags: ["physician", "hospice"],
    },
    inputSchema: categorizerInput,
    outputSchema: categorizerOutput,
    systemPrompt: categorizerSystem,
    buildPrompt: categorizerPrompt as (input: never) => string,
    safetyWarnings: ["Review generated categorization before publication."],
  },
  {
    id: "content-gap-analyzer",
    name: "Content Gap Analyzer",
    description:
      "Find unmet learning needs from the supplied catalog and usage signals.",
    category: "Content",
    version: "1.0.0",
    containsPhi: false,
    permission: "field-kit",
    featureFlag: "AI_TOOL_CONTENT_GAP_ANALYZER",
    webPath: "/tools/ai/content-gap-analyzer",
    mobilePath: "/ai-tools/content-gap-analyzer",
    fields: fields(
      jsonList("contentCatalog", "Content catalog"),
      jsonList("usageMetrics", "Usage metrics"),
      list("audiences", "Audiences"),
      list("strategicPriorities", "Strategic priorities", false),
    ),
    exampleInput: {
      contentCatalog: [{ title: "Objection basics", audience: "new reps" }],
      usageMetrics: [{ title: "Objection basics", completions: 12 }],
      audiences: ["new reps"],
      strategicPriorities: ["physician outreach"],
    },
    inputSchema: gapInput,
    outputSchema: gapOutput,
    systemPrompt: gapSystem,
    buildPrompt: gapPrompt as (input: never) => string,
    safetyWarnings: [
      "Recommendations use only the supplied catalog and usage signals.",
    ],
  },
  {
    id: "content-generator",
    name: "Content Generator",
    description: "Create evidence-aware hospice sales and education content.",
    category: "Content",
    version: "1.0.0",
    containsPhi: false,
    permission: "field-kit",
    featureFlag: "AI_TOOL_CONTENT_GENERATOR",
    webPath: "/tools/ai/content-generator",
    mobilePath: "/ai-tools/content-generator",
    fields: fields(
      text("brief", "Brief"),
      string("audience", "Audience"),
      string("format", "Format"),
      string("tone", "Tone"),
      jsonList("evidence", "Evidence", false),
    ),
    exampleInput: {
      brief: "Create a one-page referral conversation guide.",
      audience: "Hospice sales representatives",
      format: "Field guide",
      tone: "Clear and practical",
      evidence: [],
    },
    inputSchema: generatorInput,
    outputSchema: generatorOutput,
    systemPrompt: generatorSystem,
    buildPrompt: generatorPrompt as (input: never) => string,
    safetyWarnings: [
      "Review factual and regulatory claims before external use.",
    ],
  },
  {
    id: "content-recommender",
    name: "Content Recommender",
    description: "Recommend relevant items from a supplied content catalog.",
    category: "Content",
    version: "1.0.0",
    containsPhi: false,
    permission: "field-kit",
    featureFlag: "AI_TOOL_CONTENT_RECOMMENDER",
    webPath: "/tools/ai/content-recommender",
    mobilePath: "/ai-tools/content-recommender",
    fields: fields(
      json("userProfile", "User profile"),
      jsonList("contentCatalog", "Content catalog"),
      jsonList("interactionHistory", "Interaction history", false),
      json("referenceContent", "Reference content", false),
    ),
    exampleInput: {
      userProfile: { role: "new rep", focus: "SNF outreach" },
      contentCatalog: [
        { id: "objections-1", title: "SNF objections", topics: ["SNF"] },
      ],
      interactionHistory: [],
    },
    inputSchema: recommenderInput,
    outputSchema: recommenderOutput,
    systemPrompt: recommenderSystem,
    buildPrompt: recommenderPrompt as (input: never) => string,
    safetyWarnings: [
      "Recommendations are limited to the supplied content catalog.",
    ],
  },
  {
    id: "development-plan-generator",
    name: "Development Plan Generator",
    description:
      "Turn assessment findings and goals into a measurable development plan.",
    category: "Learning",
    version: "1.0.0",
    containsPhi: false,
    permission: "field-kit",
    featureFlag: "AI_TOOL_DEVELOPMENT_PLAN",
    webPath: "/tools/ai/development-plan-generator",
    mobilePath: "/ai-tools/development-plan-generator",
    fields: fields(
      json("assessmentData", "Assessment data"),
      list("goals", "Goals"),
      string("timeHorizon", "Time horizon"),
      list("availableResources", "Available resources", false),
    ),
    exampleInput: {
      assessmentData: { objectionHandling: 62, discovery: 74 },
      goals: ["Improve objection handling"],
      timeHorizon: "90 days",
      availableResources: ["Weekly manager coaching"],
    },
    inputSchema: developmentInput,
    outputSchema: developmentOutput,
    systemPrompt: developmentSystem,
    buildPrompt: developmentPrompt as (input: never) => string,
    safetyWarnings: [
      "Manager review is recommended before assigning the plan.",
    ],
  },
  {
    id: "email-optimizer",
    name: "Email Optimizer",
    description:
      "Create three ethical, personalized referral-development email options.",
    category: "Sales",
    version: "1.0.0",
    containsPhi: false,
    permission: "field-kit",
    featureFlag: "AI_TOOL_EMAIL_OPTIMIZER",
    webPath: "/tools/ai/email-optimizer",
    mobilePath: "/ai-tools/email-optimizer",
    fields: fields(
      string("prospectType", "Prospect type"),
      text("situation", "Situation"),
      text("objective", "Objective"),
      {
        key: "tone",
        label: "Tone",
        kind: "select",
        required: true,
        options: ["warm", "concise", "educational", "consultative", "direct"],
      },
      text("previousInteraction", "Previous interaction", false),
      list("accountHistory", "Account history", false),
      {
        key: "includeSequence",
        label: "Include follow-up sequence",
        kind: "boolean",
      },
    ),
    exampleInput: {
      prospectType: "Hospital case manager",
      situation: "Introductory follow-up after a networking event",
      objective: "Schedule a 15-minute education meeting",
      tone: "consultative",
      includeSequence: true,
    },
    inputSchema: emailInput,
    outputSchema: emailOutput,
    systemPrompt: emailSystem,
    buildPrompt: emailPrompt as (input: never) => string,
    safetyWarnings: [
      "Do not include patient information.",
      "Performance rankings are simulated editorial guidance, not measured A/B results.",
    ],
  },
  {
    id: "family-meeting-simulator",
    name: "Family Meeting Simulator",
    description:
      "Practice culturally humble family conversations with coaching feedback.",
    category: "Learning",
    version: "1.0.0",
    containsPhi: false,
    permission: "field-kit",
    featureFlag: "AI_TOOL_FAMILY_MEETING",
    webPath: "/tools/ai/family-meeting-simulator",
    mobilePath: "/ai-tools/family-meeting-simulator",
    fields: fields(
      text("scenario", "Scenario"),
      text("familyDynamics", "Family dynamics"),
      text("culturalBackground", "Cultural background"),
      string("difficulty", "Difficulty"),
    ),
    exampleInput: {
      scenario: "A family is divided about discussing hospice.",
      familyDynamics:
        "Two siblings disagree and the parent has not stated a preference.",
      culturalBackground: "Ask rather than assume preferences.",
      difficulty: "advanced",
    },
    inputSchema: familyInput,
    outputSchema: familyOutput,
    systemPrompt: familySystem,
    buildPrompt: familyPrompt as (input: never) => string,
    safetyWarnings: [
      "Training simulation only; do not enter real patient or family information.",
    ],
  },
  {
    id: "microlearning-generator",
    name: "Microlearning Generator",
    description: "Generate a focused two-to-three-minute learning challenge.",
    category: "Learning",
    version: "1.0.0",
    containsPhi: false,
    permission: "field-kit",
    featureFlag: "AI_TOOL_MICROLEARNING",
    webPath: "/tools/ai/microlearning-generator",
    mobilePath: "/ai-tools/microlearning-generator",
    fields: fields(
      string("userId", "Learner ID"),
      string("difficulty", "Difficulty"),
      string("category", "Category"),
      list("previousTopics", "Previous topics", false),
    ),
    exampleInput: {
      userId: "current-user",
      difficulty: "intermediate",
      category: "objection handling",
      previousTopics: ["discovery questions"],
    },
    inputSchema: learningInput,
    outputSchema: learningOutput,
    systemPrompt: learningSystem,
    buildPrompt: learningPrompt as (input: never) => string,
    safetyWarnings: ["Review generated learning content before assigning it."],
  },
  {
    id: "territory-account-discovery",
    name: "Territory Account Discovery",
    description:
      "Filter supplied healthcare facility data by territory and facility type.",
    category: "Sales",
    version: "1.0.0",
    containsPhi: false,
    permission: "field-kit",
    featureFlag: "AI_TOOL_TERRITORY_DISCOVERY",
    webPath: "/tools/ai/territory-account-discovery",
    mobilePath: "/ai-tools/territory-account-discovery",
    fields: fields(
      list("zipCodes", "ZIP codes"),
      {
        key: "radiusMiles",
        label: "Radius (miles)",
        kind: "number",
        required: true,
      },
      list("facilityTypes", "Facility types"),
      jsonList("facilities", "Optional pre-fetched facility results", false),
    ),
    exampleInput: {
      zipCodes: ["33602"],
      radiusMiles: 15,
      facilityTypes: ["hospital", "skilled nursing facility"],
      facilities: [],
    },
    inputSchema: territoryInput,
    outputSchema: territoryOutput,
    systemPrompt: "",
    buildPrompt: (() => "") as (input: never) => string,
    deterministic: true,
    safetyWarnings: [
      "Results depend on the supplied facility data and deterministic filters.",
    ],
  },
  {
    id: "admission-eligibility",
    name: "Admission Eligibility Educator",
    description:
      "Compare supplied clinical facts with cited hospice admission criteria.",
    category: "Clinical",
    version: "1.0.0",
    containsPhi: true,
    permission: "clinical:use",
    featureFlag: "AI_TOOL_ADMISSION_ELIGIBILITY",
    webPath: "/tools/ai/admission-eligibility",
    mobilePath: "/ai-tools/admission-eligibility",
    fields: fields(
      string("diagnosis", "Diagnosis"),
      text("patientCondition", "Patient condition"),
      text("functionStatus", "Functional status"),
      list("comorbidities", "Comorbidities"),
      text("recentHospitalizations", "Recent hospitalizations"),
      string("jurisdiction", "Jurisdiction", false),
      jsonList("criteria", "Cited criteria", false),
    ),
    exampleInput: {
      diagnosis: "Example diagnosis",
      patientCondition: "Documented current condition",
      functionStatus: "Documented functional status",
      comorbidities: ["Example documented comorbidity"],
      recentHospitalizations: "Documented recent utilization",
      jurisdiction: "US",
    },
    inputSchema: admissionInput,
    outputSchema: admissionOutput,
    systemPrompt: admissionSystem,
    buildPrompt: admissionPrompt as (input: never) => string,
    safetyWarnings: clinicalWarnings,
  },
  {
    id: "documentation-gap-analyzer",
    name: "Documentation Gap Analyzer",
    description:
      "Identify missing evidence against supplied hospice documentation criteria.",
    category: "Clinical",
    version: "1.0.0",
    containsPhi: true,
    permission: "clinical:use",
    featureFlag: "AI_TOOL_DOCUMENTATION_GAPS",
    webPath: "/tools/ai/documentation-gap-analyzer",
    mobilePath: "/ai-tools/documentation-gap-analyzer",
    fields: fields(
      json("clinicalData", "Clinical data"),
      jsonList("criteria", "Criteria"),
      jsonList("documentedEvidence", "Documented evidence"),
    ),
    exampleInput: {
      clinicalData: { diagnosis: "Example" },
      criteria: [{ id: "criterion-1", text: "Example criterion" }],
      documentedEvidence: [],
    },
    inputSchema: documentationInput,
    outputSchema: documentationOutput,
    systemPrompt: documentationSystem,
    buildPrompt: documentationPrompt as (input: never) => string,
    safetyWarnings: clinicalWarnings,
  },
  {
    id: "lcd-policy-sales-playbook",
    name: "LCD Policy Sales Playbook",
    description:
      "Translate a verified LCD policy change into compliant sales education.",
    category: "Compliance",
    version: "1.0.0",
    containsPhi: true,
    permission: "clinical:use",
    featureFlag: "AI_TOOL_LCD_PLAYBOOK",
    webPath: "/tools/ai/lcd-policy-sales-playbook",
    mobilePath: "/ai-tools/lcd-policy-sales-playbook",
    fields: fields(
      json("policyChange", "Policy change"),
      list("affectedAudiences", "Affected audiences"),
      jsonList("evidence", "CMS evidence"),
    ),
    exampleInput: {
      policyChange: {
        title: "Example policy update",
        effectiveDate: "2026-01-01",
      },
      affectedAudiences: ["Hospice sales teams"],
      evidence: [{ source: "CMS MCD", citation: "Policy identifier required" }],
    },
    inputSchema: playbookInput,
    outputSchema: playbookOutput,
    systemPrompt: playbookSystem,
    buildPrompt: playbookPrompt as (input: never) => string,
    safetyWarnings: clinicalWarnings,
  },
  {
    id: "medicare-lcd-advisor",
    name: "Medicare LCD Advisor",
    description:
      "Answer educational LCD questions using supplied, versioned CMS evidence.",
    category: "Clinical",
    version: "1.0.0",
    containsPhi: true,
    permission: "clinical:use",
    featureFlag: "AI_TOOL_MEDICARE_LCD_ADVISOR",
    webPath: "/tools/ai/medicare-lcd-advisor",
    mobilePath: "/ai-tools/medicare-lcd-advisor",
    fields: fields(
      string("diagnosis", "Diagnosis"),
      text("question", "Question"),
      string("jurisdiction", "Jurisdiction", false),
      text("context", "Context", false),
      jsonList("evidence", "CMS evidence", false),
    ),
    exampleInput: {
      diagnosis: "Example diagnosis",
      question:
        "What documentation categories should a qualified reviewer examine?",
      jurisdiction: "US",
      evidence: [],
    },
    inputSchema: advisorInput,
    outputSchema: advisorOutput,
    systemPrompt: advisorSystem,
    buildPrompt: advisorPrompt as (input: never) => string,
    safetyWarnings: clinicalWarnings,
  },
  {
    id: "medical-record-lcd-verifier",
    name: "Medical Record LCD Verifier",
    description:
      "Extract traceable facts and compare them with supplied LCD evidence.",
    category: "Clinical",
    version: "1.0.0",
    containsPhi: true,
    permission: "clinical:use",
    featureFlag: "AI_TOOL_MEDICAL_RECORD_LCD",
    webPath: "/tools/ai/medical-record-lcd-verifier",
    mobilePath: "/ai-tools/medical-record-lcd-verifier",
    fields: fields(
      text("recordText", "Medical record text"),
      json("fileMetadata", "File metadata", false),
      jsonList("records", "Additional records", false),
      jsonList("lcdEvidence", "LCD evidence", false),
    ),
    exampleInput: {
      recordText: "Enter or extract the medical record text.",
      lcdEvidence: [],
    },
    inputSchema: recordInput,
    outputSchema: recordOutput,
    systemPrompt: recordSystem,
    buildPrompt: recordPrompt as (input: never) => string,
    safetyWarnings: clinicalWarnings,
  },
] as const;

const toolMap = new Map<SpartanAiToolId, AiToolSpec>(
  SPARTAN_AI_TOOLS.map((tool) => [tool.id, tool]),
);

export function getSpartanAiTool(id: string): AiToolSpec | undefined {
  return toolMap.get(id as SpartanAiToolId);
}

export function isClinicalTool(tool: AiToolSpec): boolean {
  return tool.permission === "clinical:use";
}

export function publicToolManifest(tool: AiToolSpec) {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    version: tool.version,
    containsPhi: tool.containsPhi,
    permission: tool.permission,
    webPath: tool.webPath,
    mobilePath: tool.mobilePath,
    fields: tool.fields,
    exampleInput: tool.exampleInput,
    safetyWarnings: tool.safetyWarnings,
  };
}
