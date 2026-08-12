/**
 * Standard Hospice Sales Pro tool anatomy (HSP-30).
 *
 * Shared contract for web + iOS so tools feel like one product without
 * forcing identical layouts. Sections are optional — only render when they
 * add value for that tool.
 */

export const TOOL_ANATOMY_VERSION = "tool-anatomy-v1";

/** Canonical section ids — use these names in UI and design-system docs. */
export const TOOL_ANATOMY_SECTIONS = [
  "context",
  "guidance",
  "input",
  "result",
  "why",
  "next_move",
  "save",
  "related",
  "evidence",
  "feedback",
] as const;

export type ToolAnatomySectionId = (typeof TOOL_ANATOMY_SECTIONS)[number];

export type ToolAnatomySectionMeta = {
  id: ToolAnatomySectionId;
  /** Stable UI label */
  label: string;
  /** When this section earns space */
  whenToInclude: string;
  /** Prefer shared components over one-offs */
  preferredComponents: {
    web: string[];
    ios: string[];
  };
};

/**
 * Product anatomy dictionary — prevents one-off section names.
 */
export const TOOL_ANATOMY_META: Record<ToolAnatomySectionId, ToolAnatomySectionMeta> = {
  context: {
    id: "context",
    label: "Context",
    whenToInclude: "User needs orientation: tool job, kicker, breadcrumbs, category.",
    preferredComponents: {
      web: ["FieldKitToolLayout", "ToolAnatomy.Context"],
      ios: ["ToolShell", "ToolAnatomy.Context"],
    },
  },
  guidance: {
    id: "guidance",
    label: "Guidance",
    whenToInclude: "When/how/why from catalog reduces empty-form thrash.",
    preferredComponents: {
      web: ["ToolHowTo", "ToolAnatomy.Guidance"],
      ios: ["ToolShell how box", "ToolAnatomy.Guidance"],
    },
  },
  input: {
    id: "input",
    label: "Input",
    whenToInclude: "Always when the tool takes free text or structured fields.",
    preferredComponents: {
      web: ["ui/field", "ui/textarea", "ToolAnatomy.Input"],
      ios: ["SpartanInput", "ToolAnatomy.Input"],
    },
  },
  result: {
    id: "result",
    label: "Result",
    whenToInclude: "After generate — field-ready body with copy/share.",
    preferredComponents: {
      web: ["ToolResultPanel", "FieldTalkTrack", "ToolAnatomy.Result"],
      ios: ["FieldResultPanel", "ToolAnatomy.Result"],
    },
  },
  why: {
    id: "why",
    label: "Why this approach",
    whenToInclude: "When trust/rationale improves adoption (objections, AI, clinical education).",
    preferredComponents: {
      web: ["ToolAnatomy.Why"],
      ios: ["ToolAnatomy.Why"],
    },
  },
  next_move: {
    id: "next_move",
    label: "Next move",
    whenToInclude: "When a concrete field action should follow the result.",
    preferredComponents: {
      web: ["ReminderPicker", "ToolAnatomy.NextMove"],
      ios: ["ReminderPicker", "ToolAnatomy.NextMove"],
    },
  },
  save: {
    id: "save",
    label: "Save",
    whenToInclude: "When reusing the output later is valuable (not every calculator).",
    preferredComponents: {
      web: ["ToolResultPanel actions", "ToolAnatomy.Save"],
      ios: ["FieldResultPanel onSave", "SavedResponsesSection"],
    },
  },
  related: {
    id: "related",
    label: "Related",
    whenToInclude: "When a sister tool or field resource continues the job.",
    preferredComponents: {
      web: ["ToolAnatomy.Related"],
      ios: ["ToolAnatomy.Related", "ListRow"],
    },
  },
  evidence: {
    id: "evidence",
    label: "Evidence",
    whenToInclude: "Citations, sources, trust notices — never invent authority.",
    preferredComponents: {
      web: ["Citations / trust line", "ToolAnatomy.Evidence"],
      ios: ["CitationsBlock", "ToolAnatomy.Evidence"],
    },
  },
  feedback: {
    id: "feedback",
    label: "Feedback",
    whenToInclude: "Loading, empty, error, offline, success — system status, not marketing.",
    preferredComponents: {
      web: ["StateBlock", "ToolAnatomy.Feedback"],
      ios: ["EmptyState", "OfflineQueueBanner", "ToolAnatomy.Feedback"],
    },
  },
};

/**
 * Audit matrix: recommended sections per catalog tool id.
 * Unique interaction stays in each tool; these are the shared slots.
 */
const DEFAULT_FIELD_AI: ToolAnatomySectionId[] = [
  "context",
  "guidance",
  "input",
  "result",
  "why",
  "next_move",
  "save",
  "related",
  "evidence",
  "feedback",
];

const CALCULATOR: ToolAnatomySectionId[] = [
  "context",
  "guidance",
  "input",
  "result",
  "next_move",
  "related",
  "feedback",
];

const COMMAND: ToolAnatomySectionId[] = [
  "context",
  "guidance",
  "input",
  "result",
  "next_move",
  "related",
  "feedback",
];

/** Explicit overrides; unknown tools get DEFAULT_FIELD_AI. */
export const TOOL_ANATOMY_BY_ID: Record<string, ToolAnatomySectionId[]> = {
  "sales-workflow": COMMAND,
  objections: DEFAULT_FIELD_AI,
  playbooks: [
    "context",
    "guidance",
    "input",
    "result",
    "why",
    "next_move",
    "save",
    "related",
    "feedback",
  ],
  research: [
    "context",
    "guidance",
    "input",
    "result",
    "evidence",
    "related",
    "feedback",
  ],
  "role-play": [
    "context",
    "guidance",
    "input",
    "result",
    "why",
    "next_move",
    "save",
    "related",
    "feedback",
  ],
  "email-templates": [
    "context",
    "guidance",
    "input",
    "result",
    "save",
    "related",
    "feedback",
  ],
  "cold-call": [
    "context",
    "guidance",
    "input",
    "result",
    "next_move",
    "save",
    "related",
    "feedback",
  ],
  "weekly-plan": [
    "context",
    "guidance",
    "input",
    "result",
    "next_move",
    "save",
    "related",
    "feedback",
  ],
  "activity-calculator": CALCULATOR,
  roi: CALCULATOR,
  "rep-cost": CALCULATOR,
  branch: CALCULATOR,
  transcribe: [
    "context",
    "guidance",
    "input",
    "result",
    "evidence",
    "feedback",
  ],
  "brand-video": ["context", "guidance", "result", "related", "feedback"],
};

export function anatomySectionsForTool(toolId: string): ToolAnatomySectionId[] {
  return TOOL_ANATOMY_BY_ID[toolId] ?? DEFAULT_FIELD_AI;
}

export function toolUsesSection(
  toolId: string,
  section: ToolAnatomySectionId,
): boolean {
  return anatomySectionsForTool(toolId).includes(section);
}

/** Anti one-off: forbidden alternate labels that should map to the contract. */
export const DEPRECATED_SECTION_ALIASES: Record<string, ToolAnatomySectionId> = {
  output: "result",
  answer: "result",
  response: "result",
  rationale: "why",
  "next step": "next_move",
  "next steps": "next_move",
  sources: "evidence",
  citations: "evidence",
  disclaimer: "evidence",
  howto: "guidance",
  instructions: "guidance",
};

export function normalizeSectionAlias(raw: string): ToolAnatomySectionId | null {
  const key = raw.trim().toLowerCase();
  if ((TOOL_ANATOMY_SECTIONS as readonly string[]).includes(key)) {
    return key as ToolAnatomySectionId;
  }
  return DEPRECATED_SECTION_ALIASES[key] ?? null;
}
