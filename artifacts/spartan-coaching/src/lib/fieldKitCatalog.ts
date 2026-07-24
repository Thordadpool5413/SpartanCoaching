/**
 * Single inventory for Field Kit tools (and how-to copy).
 * Portal, tools page, and tool headers should use this catalog.
 */

export type FieldKitCategory = "Prepare" | "Practice" | "Plan" | "Measure" | "Outreach" | "Learn";

export type ChecklistId =
  | "objection"
  | "weekly_plan"
  | "roleplay"
  | "debrief"
  | "director_scorecard";

export interface FieldKitTool {
  id: string;
  title: string;
  description: string;
  path: string;
  category: FieldKitCategory;
  /** When to open this tool */
  whenToUse: string;
  /** Three short how steps */
  howSteps: [string, string, string];
  /** Why it matters in the field */
  why: string;
  /** Maps successful use → portal checklist item */
  checklistId?: ChecklistId;
  public?: boolean;
}

export const FIELD_KIT_WHAT =
  "Private tools and resources for hospice growth execution between coaching sessions — prepare, practice, plan, and measure.";

export const FIELD_KIT_WHY =
  "So Tuesday behavior improves: better conversations, clearer weeks, and fewer eligible patients left without a referral path.";

export const FIELD_KIT_HOW =
  "Pick your role → run this week’s recommended actions → open the matching tool or download → book a debrief while access is open.";

export const FIELD_KIT_TOOLS: FieldKitTool[] = [
  {
    id: "sales-workflow",
    title: "Sales Command Center",
    description: "Plan each account call, practice, capture outcomes, review coaching, and schedule the next step.",
    path: "/tools/sales-workflow",
    category: "Plan",
    whenToUse: "Every day—from pre-call preparation through the confirmed next appointment.",
    howSteps: [
      "Add the account, contacts, and meeting time",
      "Build and practice the connected call plan",
      "Complete the call and approve the next action",
    ],
    why: "Every visit becomes part of one continuous, coachable account workflow.",
  },
  {
    id: "playbooks",
    title: "Playbook Generator",
    description: "Custom strategic playbooks for any sales scenario — talking points and next steps.",
    path: "/tools/playbooks",
    category: "Prepare",
    whenToUse: "Before a high-stakes visit or when a territory needs one clear play.",
    howSteps: [
      "Name the account type and goal",
      "Generate the playbook",
      "Take the next-step ask into the field",
    ],
    why: "Reps stop winging visits and leave with a specific commitment.",
  },
  {
    id: "objections",
    title: "Objection Handler",
    description: "Field-ready responses to hospice objections you hear this week.",
    path: "/tools/objections",
    category: "Practice",
    whenToUse: "When you just heard a real objection — or expect one this afternoon.",
    howSteps: [
      "Paste the exact words (no PHI)",
      "Generate a response",
      "Practice once out loud, then use it",
    ],
    why: "Stalled conversations become education moments that move referrals.",
    checklistId: "objection",
  },
  {
    id: "research",
    title: "Grounded Research",
    description: "Territory and market questions with credible sources.",
    path: "/tools/research",
    category: "Prepare",
    whenToUse: "Before opening a new account or refreshing a priority facility.",
    howSteps: ["Ask one focused territory question", "Review sources", "Note one insight for the visit"],
    why: "Credibility in the room starts with homework, not hope.",
  },
  {
    id: "transcribe",
    title: "Call Transcriber",
    description: "Transcribe and review calls for coaching moments.",
    path: "/tools/transcribe",
    category: "Practice",
    whenToUse: "After a call you want to coach or self-review (no PHI).",
    howSteps: ["Upload or paste audio notes", "Review the transcript", "Pull one coaching moment"],
    why: "Self-coaching beats guessing what happened on the call.",
  },
  {
    id: "email-templates",
    title: "Email Templates",
    description: "Follow-ups, thank-yous, and value-adds that stay professional.",
    path: "/tools/email-templates",
    category: "Prepare",
    whenToUse: "When follow-up would otherwise slip or sound generic.",
    howSteps: ["Choose the email type", "Add context (no PHI)", "Edit and send the same day"],
    why: "Consistent follow-up keeps referral relationships warm.",
  },
  {
    id: "role-play",
    title: "Role-Play Practice",
    description: "Simulate physician and family conversations with feedback.",
    path: "/tools/role-play",
    category: "Practice",
    whenToUse: "Before a hard conversation you cannot afford to fumble.",
    howSteps: ["Pick a scenario", "Run the role-play", "Note one phrase to reuse live"],
    why: "Muscle memory shows up when the clinic is short-staffed.",
    checklistId: "roleplay",
  },
  {
    id: "activity-calculator",
    title: "Activity Calculator",
    description: "Turn admission goals into daily conversation targets.",
    path: "/tools/activity-calculator",
    category: "Measure",
    whenToUse: "When goals are clear but the daily math is not.",
    howSteps: ["Enter the admission goal", "Review daily targets", "Coach the team to the number"],
    why: "Leaders stop managing hope and start managing conversations.",
    checklistId: "director_scorecard",
  },
  {
    id: "rep-cost",
    title: "Rep Cost Calculator",
    description: "Fully loaded cost per call, referral, and admission.",
    path: "/tools/rep-cost-calculator",
    category: "Measure",
    whenToUse: "When you need economics for staffing or coaching ROI.",
    howSteps: ["Enter loaded cost inputs", "Review unit costs", "Use numbers in a leadership conversation"],
    why: "Clear economics support better coaching investment decisions.",
  },
  {
    id: "roi",
    title: "ROI Calculator",
    description: "Estimate coaching impact on revenue and conversion.",
    path: "/tools/roi-calculator",
    category: "Measure",
    whenToUse: "Before or after a coaching engagement discussion.",
    howSteps: ["Enter baseline metrics", "Model improvement", "Share the range with leadership"],
    why: "Puts a business case next to the coaching conversation.",
  },
  {
    id: "branch",
    title: "Branch Profitability Simulator",
    description: "Break-even ADC, staffing, and cash runway for your branch.",
    path: "/tools/branch-profitability",
    category: "Measure",
    whenToUse: "When census, staffing, and growth pressure need one model.",
    howSteps: ["Enter branch inputs", "Stress-test scenarios", "Align coaching focus to the gap"],
    why: "Owners and VPs connect field behavior to branch economics.",
  },
  {
    id: "cold-call",
    title: "Cold Call Script Generator",
    description: "Openers, objection handlers, and a clear next-step ask.",
    path: "/tools/cold-call-script",
    category: "Prepare",
    whenToUse: "Before a block of new outreach calls.",
    howSteps: ["Describe the target", "Generate the script", "Make ten calls with the same ask"],
    why: "Consistent openers raise the floor on new account work.",
  },
  {
    id: "weekly-plan",
    title: "Weekly Plan Builder",
    description: "Monday–Friday territory plan with win conditions.",
    path: "/tools/weekly-plan-builder",
    category: "Plan",
    whenToUse: "Sunday night or Monday morning — before the week runs you.",
    howSteps: ["Set the week’s win condition", "Build the day plan", "Execute and adjust midweek"],
    why: "Priority accounts get time; low-value busyness loses it.",
    checklistId: "weekly_plan",
  },
  {
    id: "brand-video",
    title: "Brand Video",
    description: "Share the Spartan brand video with prospects — public link.",
    path: "/brand-video",
    category: "Outreach",
    whenToUse: "When a prospect needs a clear, human introduction to Spartan.",
    howSteps: ["Open the video page", "Copy the share link", "Send with one sentence of context"],
    why: "A strong first impression without a long pitch deck.",
    public: true,
  },
];

export function getToolByPath(path: string): FieldKitTool | undefined {
  return FIELD_KIT_TOOLS.find((t) => t.path === path || path.startsWith(t.path + "/"));
}

export function getToolById(id: string): FieldKitTool | undefined {
  return FIELD_KIT_TOOLS.find((t) => t.id === id);
}

export const FIELD_KIT_CATEGORIES: FieldKitCategory[] = [
  "Prepare",
  "Practice",
  "Plan",
  "Measure",
  "Outreach",
];
