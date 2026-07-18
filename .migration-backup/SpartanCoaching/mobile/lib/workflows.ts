export type ToolSlug =
  | "playbooks"
  | "objections"
  | "research"
  | "cold-call-script"
  | "email-templates"
  | "weekly-plan-builder"
  | "transcribe";

export type CalculatorSlug = "roi" | "activity" | "branch-profitability";

export type WorkflowDefinition = {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  resultLabel: string;
  exportTitle: string;
  exportSubtitle: string;
};

export const TOOL_DEFINITIONS: Record<ToolSlug, WorkflowDefinition> = {
  playbooks: {
    slug: "playbooks",
    title: "Playbooks",
    kicker: "Scenario guidance",
    summary: "Turn a real field scenario into a practical next-step playbook.",
    resultLabel: "Playbook",
    exportTitle: "Playbook",
    exportSubtitle: "Scenario guidance for the field",
  },
  objections: {
    slug: "objections",
    title: "Objections",
    kicker: "Response builder",
    summary: "Generate a compassionate, useful reply to a real objection.",
    resultLabel: "Response",
    exportTitle: "Objection response",
    exportSubtitle: "Field-ready language for a tough moment",
  },
  research: {
    slug: "research",
    title: "Research",
    kicker: "Grounded answer",
    summary: "Ask a research question and get a concise answer with sources.",
    resultLabel: "Research summary",
    exportTitle: "Research",
    exportSubtitle: "Grounded summary and sources",
  },
  "cold-call-script": {
    slug: "cold-call-script",
    title: "Cold Call Script",
    kicker: "Opening line",
    summary: "Write a tight opener that sounds human instead of templated.",
    resultLabel: "Script",
    exportTitle: "Cold call script",
    exportSubtitle: "Short, useful language for prospecting",
  },
  "email-templates": {
    slug: "email-templates",
    title: "Email Templates",
    kicker: "Follow-up writing",
    summary: "Draft a follow-up, thank-you, or value-add email quickly.",
    resultLabel: "Template",
    exportTitle: "Email template",
    exportSubtitle: "Mobile-friendly coaching draft",
  },
  "weekly-plan-builder": {
    slug: "weekly-plan-builder",
    title: "Weekly Plan",
    kicker: "Weekly cadence",
    summary: "Turn a territory and goal into a realistic weekly plan.",
    resultLabel: "Plan",
    exportTitle: "Weekly plan",
    exportSubtitle: "Cadence plan generated from the backend",
  },
  transcribe: {
    slug: "transcribe",
    title: "Transcript Analysis",
    kicker: "Call review",
    summary: "Paste a transcript and get coaching feedback on the call.",
    resultLabel: "Analysis",
    exportTitle: "Transcript analysis",
    exportSubtitle: "Coaching review for a call transcript",
  },
};

export const CALCULATOR_DEFINITIONS: Record<CalculatorSlug, WorkflowDefinition> = {
  roi: {
    slug: "roi",
    title: "ROI Calculator",
    kicker: "Value estimate",
    summary: "Estimate the revenue lift from a coaching or process improvement.",
    resultLabel: "ROI",
    exportTitle: "ROI calculator",
    exportSubtitle: "Revenue impact summary",
  },
  activity: {
    slug: "activity",
    title: "Activity Calculator",
    kicker: "Cadence planning",
    summary: "Translate an admissions goal into a weekly activity target.",
    resultLabel: "Plan",
    exportTitle: "Activity calculator",
    exportSubtitle: "Field cadence summary",
  },
  "branch-profitability": {
    slug: "branch-profitability",
    title: "Branch Profitability",
    kicker: "Operating model",
    summary: "Run the branch profitability engine on mobile without losing the details.",
    resultLabel: "Model",
    exportTitle: "Branch profitability",
    exportSubtitle: "Full operating model summary",
  },
};

