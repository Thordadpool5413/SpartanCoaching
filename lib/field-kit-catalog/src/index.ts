/**
 * Single Membership tool inventory — web + mobile.
 * mobile: "native" | "webview" | "missing" tracks parity debt.
 */

export type FieldKitCategory = "Prepare" | "Practice" | "Plan" | "Measure" | "Outreach" | "Learn";

export type ChecklistId =
  | "objection"
  | "weekly_plan"
  | "roleplay"
  | "debrief"
  | "director_scorecard";

export type MobileDelivery = "native" | "webview" | "missing";

export interface FieldKitTool {
  id: string;
  title: string;
  description: string;
  /** Web path (absolute site path) */
  path: string;
  category: FieldKitCategory;
  whenToUse: string;
  howSteps: [string, string, string];
  why: string;
  checklistId?: ChecklistId;
  public?: boolean;
  /** Expo route for native screens */
  mobileRoute?: string;
  /** How mobile delivers this tool today */
  mobile: MobileDelivery;
  /** Optional tool tab key inside tools.tsx flow */
  mobileToolTab?: string;
  /**
   * Competitive-edge framing for the Membership marketing page.
   * scenario: the real-world pressure moment this tool resolves.
   * outcome: the concrete edge the rep gains by having the answer.
   * When present, both pages (FieldKit, FieldKitMembership) use these
   * strings so copy never drifts from the catalog definition.
   */
  scenario?: string;
  outcome?: string;
}

export const FIELD_KIT_WHAT =
  "Hospice Sales Pro tools and resources for hospice growth — prepare, practice, plan, and measure on web and iPhone.";

export const FIELD_KIT_WHY =
  "So Tuesday behavior improves: better conversations, clearer weeks, and fewer eligible patients left without a referral path.";

export const FIELD_KIT_HOW =
  "Open Sales Command Center for the next call → prepare and practice → capture the outcome → use satellite tools as needed → book a debrief while access is open.";

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
    mobileRoute: "/sales-workflow",
    mobile: "native",
    scenario:
      "You're 10 minutes from a visit at a new SNF. The rep who walks in prepared gets the next call. The one running on memory and hope gets a polite 'we'll be in touch.'",
    outcome:
      "Pre-call plan, practice mode, outcome capture, and next step confirmed — all in one continuous workflow. Preparation is the edge most reps skip.",
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
    mobileRoute: "/(tabs)/tools",
    mobileToolTab: "playbook",
    mobile: "native",
    scenario:
      "You're heading into St. Mary's for the third visit. No referral yet. The rep who shows up without a specific ask leaves with another 'we'll keep you in mind.'",
    outcome:
      "A custom playbook with the right talking points for this stage of the relationship and one precise ask. You walk in as the consultant they want to call — not another vendor in the waiting room.",
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
    mobileRoute: "/(tabs)/tools",
    mobileToolTab: "objection",
    mobile: "native",
    scenario:
      "You just heard 'we already have a preferred hospice' for the third time this month. The rep who doesn't have an answer loses the account. You have 20 minutes before the next call.",
    outcome:
      "A field-ready response in 30 seconds — grounded in the actual concern, not a canned comeback. The rep who walks in with this wins the conversation the other rep fumbles.",
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
    mobileRoute: "/(tabs)/tools",
    mobileToolTab: "research",
    mobile: "native",
    scenario:
      "You're opening a new SNF in a market you don't know well. The rep who walks in with one credible insight earns the handshake. The one who wings it looks like every other vendor.",
    outcome:
      "Territory and market answers with sources you can cite — homework that builds trust in the room, not hope.",
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
    mobileRoute: "/tool-web",
    mobile: "webview",
    scenario:
      "You just left a hard conversation and want to coach yourself (or a rep) without relying on memory alone.",
    outcome:
      "Transcript plus coaching moments — one phrase or pivot to reuse on the next call. No PHI in the tool.",
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
    mobileRoute: "/(tabs)/tools",
    mobileToolTab: "email",
    mobile: "native",
    scenario:
      "You left St. Mary's with a verbal 'maybe.' The follow-up keeps the relationship warm or lets it go cold. Most reps send something generic on Thursday. The best ones send something specific that afternoon.",
    outcome:
      "A professional, account-specific email in two minutes — written at the right tone for a referral relationship, not a sales pitch. The rep the facility remembers is the one who followed up first.",
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
    mobileRoute: "/(tabs)/tools",
    mobileToolTab: "roleplay",
    mobile: "native",
    scenario:
      "The charge nurse keeps saying 'I'll pass it along.' The rep who practices this conversation once wins it. The one who wings it loses the referral.",
    outcome:
      "Simulated back-and-forth with coaching feedback before you're in the room. When it counts, you're not searching for words — you already know how this ends.",
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
    mobileRoute: "/activity-calculator",
    mobile: "native",
    scenario:
      "Leadership set an admission goal. The team hears 'work harder' but no one has the daily conversation math.",
    outcome:
      "Admission goal broken into conversations per day — a number you can coach to, not a vague stretch target.",
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
    mobileRoute: "/rep-cost-calculator",
    mobile: "native",
    scenario:
      "Someone asked what a rep actually costs per call, referral, and admission. Spreadsheet theater isn't cutting it.",
    outcome:
      "Fully loaded unit costs you can use in staffing and coaching investment conversations.",
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
    mobileRoute: "/roi-calculator",
    mobile: "native",
    scenario:
      "You're justifying coaching or Membership access to a CFO who only responds to dollars and conversion.",
    outcome:
      "A revenue range next to each percentage-point improvement — a business case, not a feature list.",
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
    mobileRoute: "/staffing",
    mobile: "native",
    scenario:
      "Census is soft, staffing is tight, and leadership wants one model that ties field behavior to branch economics.",
    outcome:
      "Break-even ADC, staffing, and cash runway in one simulator — so coaching focus maps to the real gap.",
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
    mobileRoute: "/(tabs)/tools",
    mobileToolTab: "cold",
    mobile: "native",
    scenario:
      "You have a two-hour block for new outreach. The opener makes the difference. The rep who earns 30 seconds gets a referral relationship. The one who wings it gets a voicemail.",
    outcome:
      "A consistent script with an opener that earns the conversation, an objection handler built in, and one clear next-step ask. Cold to warm in a single call.",
  },
  {
    id: "weekly-plan",
    title: "Weekly Plan Builder",
    description: "Monday–Friday territory plan with win conditions.",
    path: "/tools/weekly-plan-builder",
    category: "Plan",
    whenToUse: "Sunday night or Monday morning — before the week runs you.",
    howSteps: ["Set the week's win condition", "Build the day plan", "Execute and adjust midweek"],
    why: "Priority accounts get time; low-value busyness loses it.",
    checklistId: "weekly_plan",
    mobileRoute: "/(tabs)/tools",
    mobileToolTab: "weekly",
    mobile: "native",
    scenario:
      "It's Sunday night. You have 15 accounts, one open referral, three pending conversations. The rep who plans wins. The one who starts reactive loses to the rep who already called.",
    outcome:
      "A Monday–Friday plan with win conditions per day. Priority accounts get your best hours. Low-value busyness loses them. The top reps in your market planned their week on Sunday.",
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
    mobileRoute: "/brand-video",
    mobile: "native",
  },
];

export function getToolByPath(path: string): FieldKitTool | undefined {
  return FIELD_KIT_TOOLS.find((t) => t.path === path || path.startsWith(t.path + "/"));
}

export function getToolById(id: string): FieldKitTool | undefined {
  return FIELD_KIT_TOOLS.find((t) => t.id === id);
}

export function toolsByCategory(category: FieldKitCategory): FieldKitTool[] {
  return FIELD_KIT_TOOLS.filter((t) => t.category === category);
}

export function mobileParityDebt(): FieldKitTool[] {
  return FIELD_KIT_TOOLS.filter((t) => t.mobile === "missing" || t.mobile === "webview");
}

/** Human label for mobile delivery — used in catalog UI */
export function mobileDeliveryLabel(mobile: MobileDelivery): string {
  switch (mobile) {
    case "native":
      return "Native app";
    case "webview":
      return "Full web tool in app";
    case "missing":
      return "Web only";
    default:
      return mobile;
  }
}

export const FIELD_KIT_CATEGORIES: FieldKitCategory[] = [
  "Prepare",
  "Practice",
  "Plan",
  "Measure",
  "Outreach",
];

/**
 * Shared tool grouping for web Tools page and mobile Tools catalog.
 * IDs must exist in FIELD_KIT_TOOLS (enforced by parity tests).
 */
export const FIELD_KIT_DAILY_TOOL_IDS = [
  "sales-workflow",
  "objections",
  "playbooks",
  "role-play",
  "weekly-plan",
  "cold-call",
  "email-templates",
] as const;

/** Leader / economics tools — same order web + mobile. */
export const FIELD_KIT_LEADER_TOOL_IDS = [
  "activity-calculator",
  "roi",
  "rep-cost",
  "branch",
] as const;

export type FieldKitDailyToolId = (typeof FIELD_KIT_DAILY_TOOL_IDS)[number];
export type FieldKitLeaderToolId = (typeof FIELD_KIT_LEADER_TOOL_IDS)[number];

export {
  COMMAND_CENTER_CAPABILITIES,
  COMMAND_CENTER_GATED_SMOKE_PATHS,
  sharedCommandCenterFacts,
  mobileCommandCenterSupported,
  mobileCommandCenterGaps,
  type CommandCenterCapability,
  type CommandCenterSupport,
} from "./command-center";

export {
  CLASSIC_FIELD_TOOL_ROUTES,
  TOOL_STACKS,
  type ClassicFieldToolRoute,
} from "./tool-architecture";

export {
  DISCOVERY_IA_VERSION,
  DISCOVERY_INTENT_SPECS,
  PRODUCT_SURFACE_PLACEMENT,
  buildDiscoveryIntents,
  filterIntentsByQuery,
  secondaryCategoriesStillSupported,
  assertIntentToolReferences,
  type DiscoveryIntentId,
  type DiscoveryIntent,
  type DiscoveryDestination,
  type ProductSurface,
} from "./intent-architecture";

import {
  buildDiscoveryIntents,
  filterIntentsByQuery as filterIntentsByQueryImpl,
  type DiscoveryIntentId,
} from "./intent-architecture";

/** Resolved intent map (tool paths from live catalog). */
export const DISCOVERY_INTENTS = buildDiscoveryIntents(getToolById);

export function getDiscoveryIntent(id: DiscoveryIntentId) {
  return DISCOVERY_INTENTS.find((i) => i.id === id);
}

export function toolsForIntent(intentId: DiscoveryIntentId): FieldKitTool[] {
  const intent = getDiscoveryIntent(intentId);
  if (!intent) return [];
  return intent.destinations
    .filter((d) => d.kind === "tool" || d.kind === "command")
    .map((d) => getToolById(d.id))
    .filter((t): t is FieldKitTool => Boolean(t));
}

export function filterDiscoveryIntents(q: string) {
  return filterIntentsByQueryImpl(DISCOVERY_INTENTS, q);
}

/**
 * Category display labels and elite-positioning blurbs for the membership page.
 * Kept here so a new category added to FIELD_KIT_TOOLS is visible in one place.
 */
export const FIELD_KIT_CAT_BLURBS: Partial<Record<FieldKitCategory, { label: string; blurb: string }>> = {
  Prepare: {
    label: "Prepare",
    blurb: "Build the right approach before every visit",
  },
  Practice: {
    label: "Practice",
    blurb: "Sharpen the conversations that move referrals",
  },
  Plan: {
    label: "Plan",
    blurb: "Structure every week and every account call",
  },
  Measure: {
    label: "Measure",
    blurb: "Connect field behavior to business outcomes",
  },
};
