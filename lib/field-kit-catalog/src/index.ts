/**
 * Single Membership tool inventory — web + mobile.
 * mobile: "native" | "webview" | "missing" tracks parity debt.
 */

export * from "./membership-plans";
export * from "./hhh-mac-jurisdictions";

export type FieldKitCategory = "Prepare" | "Practice" | "Plan" | "Measure" | "Outreach" | "Learn";
export type { CatalogDestinationOwner } from "./destination-contract";
export {
  SPARTAN_DESTINATION_CONTRACTS,
  getDestinationContract,
  validateDestinationContracts,
  catalogOwnershipErrors,
} from "./destination-contract";
export type { SpartanDestinationContract, SpartanDestinationId } from "./destination-contract";

export type ChecklistId =
  | "objection"
  | "weekly_plan"
  | "roleplay"
  | "debrief"
  | "director_scorecard";

export type MobileDelivery = "native" | "webview" | "missing";

export interface FieldKitTool {
  id: string;
  /** Destination that owns this tool before it is exposed to search, tours, or navigation. */
  owner: import("./destination-contract").CatalogDestinationOwner;
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
  /** Individual membership required for live use. */
  membership?: "standard" | "elite";
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

/**
 * Completion guidance follows the tool across web and iPhone. It deliberately
 * describes the product boundary instead of promising that client-side drafts
 * or generated text are stored somewhere they are not.
 */
export type FieldKitWorkGuide = {
  /** The moment in the field workflow this experience is designed for. */
  phase: "prepare" | "practice" | "execute" | "review";
  audience: string;
  inputHint: string;
  outputPreview: string;
  persistence: string;
  reviewCheckpoint: string;
  nextToolId?: string;
};

export const FIELD_KIT_WHAT =
  "Hospice Sales Pro tools and resources for hospice growth — prepare, practice, plan, and measure on web and iPhone.";

export const FIELD_KIT_WHY =
  "So Tuesday behavior improves: better conversations, clearer weeks, and fewer eligible patients left without a referral path.";

export const FIELD_KIT_HOW =
  "Open Sales Command Center for the next call → prepare and practice → capture the outcome → use satellite tools as needed → book a debrief while access is open.";

export const FIELD_KIT_TOOLS: FieldKitTool[] = [
  {
    id: "sales-workflow",
    owner: "command",
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
    id: "spartan-intelligence",
    title: "Spartan Intelligence",
    description: "Verify referral sources and turn public provider data into focused account preparation.",
    path: "/tools/intelligence",
    category: "Prepare",
    whenToUse: "Before opening a new account, reconnecting with a provider, or preparing for an important visit.",
    howSteps: [
      "Find the provider or organization",
      "Confirm the verified public record",
      "Build the meeting brief and take one clear objective into the room",
    ],
    why: "The rep enters with verified context, better questions, and a purpose that respects the account's time.",
    mobileRoute: "/spartan-intelligence",
    mobile: "native",
    membership: "elite",
    scenario: "You are walking into an account you do not know well. A name and address are not preparation. You need verified context and a reason for the conversation.",
    outcome: "A sourced provider profile, focused meeting objective, human opening, discovery questions, and a clear next move.",
  },
  {
    id: "playbooks",
    owner: "explore",
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
    owner: "explore",
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
    owner: "explore",
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
    owner: "explore",
    title: "Call Transcriber",
    description: "Transcribe and review calls for coaching moments.",
    path: "/tools/transcribe",
    category: "Practice",
    whenToUse: "After a call you want to coach or self-review (no PHI).",
    howSteps: ["Upload or paste audio notes", "Review the transcript", "Pull one coaching moment"],
    why: "Self-coaching beats guessing what happened on the call.",
    mobileRoute: "/transcriber",
    mobile: "native",
    membership: "elite",
    scenario:
      "You just left a hard conversation and want to coach yourself (or a rep) without relying on memory alone.",
    outcome:
      "Transcript plus coaching moments — one phrase or pivot to reuse on the next call. No PHI in the tool.",
  },
  {
    id: "email-templates",
    owner: "explore",
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
    owner: "explore",
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
    owner: "explore",
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
    owner: "explore",
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
    owner: "explore",
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
    owner: "explore",
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
    owner: "explore",
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
    owner: "explore",
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
    owner: "library",
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

const PRIORITY_WORK_GUIDES: Record<string, FieldKitWorkGuide> = {
  "sales-workflow": {
    phase: "execute",
    audience: "Sales reps and leaders managing active accounts",
    inputHint:
      "Add only professional account context and the next action you need to confirm. Never enter patient identifiers or PHI.",
    outputPreview:
      "A connected pre-call plan, practice path, outcome capture, and confirmed next step for the account.",
    persistence:
      "Account and call work stays in Sales Command Center’s own workspace. Keep PHI out, and do not rely on device or offline storage for continuity.",
    reviewCheckpoint: "Before leaving the account, confirm the owner, date, and next action—not just a note.",
    nextToolId: "playbooks",
  },
  playbooks: {
    phase: "prepare",
    audience: "Reps preparing for a priority visit or account move",
    inputHint:
      "Describe the referral-source situation, pressure point, and desired commitment. Use deidentified business context only.",
    outputPreview:
      "A visit strategy with talking points, discovery questions, and one precise next-step ask.",
    persistence:
      "A generated playbook stays in the current session until you copy or download it. Save the final version only in your permitted work system.",
    reviewCheckpoint: "Circle one discovery question and one ask you will actually use in the room.",
    nextToolId: "sales-workflow",
  },
  objections: {
    phase: "practice",
    audience: "Reps handling a live referral-source objection",
    inputHint:
      "Use the exact objection in deidentified form and add only the professional context that changes your response.",
    outputPreview:
      "A field-ready response you can practice once, adapt to the conversation, and use on the next call.",
    persistence:
      "The response stays on screen until you copy it. It is not automatically added to shared saved work.",
    reviewCheckpoint: "Say it aloud once and remove any phrase that sounds defensive, clinical, or generic.",
    nextToolId: "role-play",
  },
  "role-play": {
    phase: "practice",
    audience: "Reps and managers rehearsing a high-stakes conversation",
    inputHint:
      "Choose the real conversation you need to rehearse, but never use patient identifiers, clinical details, or PHI.",
    outputPreview:
      "A practice conversation with feedback and one phrase or pivot to carry into the live visit.",
    persistence:
      "Role-play feedback stays in the current session only. It is not added to run history, shared saved work, device storage, or cross-device continuity.",
    reviewCheckpoint: "Write down the one phrase to reuse and the one behavior to change on the next call.",
    nextToolId: "sales-workflow",
  },
  "weekly-plan": {
    phase: "prepare",
    audience: "Reps and leaders setting a focused territory week",
    inputHint:
      "List priority accounts, territory context, and the week’s win condition. Use professional account context only—never PHI.",
    outputPreview:
      "A Monday–Friday territory plan with daily win conditions, visit objectives, and a Friday review.",
    persistence:
      "Your plan is available to copy or download in this session. It is not automatically added to My Work, so retain the final plan in your permitted system.",
    reviewCheckpoint: "End Friday by marking the commitment kept, moved, or lost and carry one lesson into next week.",
    nextToolId: "sales-workflow",
  },
  "cold-call": {
    phase: "prepare",
    audience: "Reps opening a focused new-account outreach block",
    inputHint:
      "Describe the target organization, your reason for calling, and the commitment you want. Keep all context deidentified.",
    outputPreview:
      "An opener, objection response, and a clear ask you can use for one focused outreach block.",
    persistence:
      "The script remains on screen until you copy or download it; it is not automatically added to shared saved work.",
    reviewCheckpoint: "After ten calls, record the opener that earned the most conversation and adjust only one variable.",
    nextToolId: "sales-workflow",
  },
  "email-templates": {
    phase: "execute",
    audience: "Reps following up with referral partners",
    inputHint:
      "Add the relationship context, purpose, and tone. Never enter patient details, PHI, or sensitive clinical notes.",
    outputPreview:
      "A professional draft you can edit, copy, download, or intentionally send with a clear follow-up reminder.",
    persistence:
      "Generated drafts remain in the current session. A scheduled reminder is not proof that an email was sent; confirm the send action separately.",
    reviewCheckpoint: "Read the draft as the recipient: is the ask specific, easy to answer, and tied to the conversation?",
    nextToolId: "sales-workflow",
  },
};

export function getToolWorkGuide(toolOrId: FieldKitTool | string): FieldKitWorkGuide {
  const tool =
    typeof toolOrId === "string" ? getToolById(toolOrId) : toolOrId;

  if (!tool) {
    return {
      phase: "prepare",
      audience: "Hospice sales professionals",
      inputHint: "Use deidentified professional context only. Never enter patient identifiers or PHI.",
      outputPreview: "A practical result you can review, adapt, and use in your next field action.",
      persistence:
        "Results are not automatically shared or stored by this guide. Copy or download only what belongs in your permitted work system.",
      reviewCheckpoint: "Check the result for accuracy, tone, and one concrete action before using it.",
    };
  }

  return (
    PRIORITY_WORK_GUIDES[tool.id] ?? {
      phase:
        tool.category === "Practice"
          ? "practice"
          : tool.category === "Measure"
            ? "review"
            : tool.category === "Outreach"
              ? "execute"
              : "prepare",
      audience:
        tool.category === "Measure"
          ? "Sales leaders and operators"
          : "Hospice sales professionals",
      inputHint: `${tool.howSteps[0]}. Use deidentified professional business context only—never PHI.`,
      outputPreview: tool.outcome ?? `${tool.description} Review the result before using it in the field.`,
      persistence:
        "Results remain in the current session unless this tool offers an explicit save, copy, or download action. Keep any retained work in your permitted system.",
      reviewCheckpoint:
        tool.category === "Measure"
          ? "Compare the result with the operating reality and decide what metric or behavior changes next."
          : "Check the result for accuracy, tone, and one concrete action before using it.",
      nextToolId: tool.id === "brand-video" ? undefined : "sales-workflow",
    }
  );
}

/** Completion guidance for downloadable and provider-owned field resources. */
export type FieldKitResourceWorkGuide = {
  phase: "prepare" | "practice" | "execute" | "review";
  job: string;
  outputPreview: string;
  checklist: [string, string, string];
  inputHint: string;
  persistence: string;
  reviewCheckpoint: string;
  nextToolId?: string;
};

/**
 * Optional organization-owned overrides for a provider resource's field job.
 * These values are intentionally limited to static workflow guidance. They
 * never contain member-entered work or generated output.
 */
export type FieldKitResourceWorkflowCustomization = {
  job?: string;
  expectedOutput?: string;
  reviewCheckpoint?: string;
  nextToolId?: string;
};

function workflowText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getResourceWorkGuide(input: {
  category?: string | null;
  relatedToolIds?: string[] | null;
  workflow?: FieldKitResourceWorkflowCustomization | null;
}): FieldKitResourceWorkGuide {
  const category = input.category?.toLowerCase() ?? "";
  const guides: Record<string, FieldKitResourceWorkGuide> = {
    template: {
      phase: "prepare",
      job: "Build a clear field plan before the next visit or territory block.",
      outputPreview: "A completed, deidentified plan or worksheet with one commitment ready for the next field block.",
      checklist: [
        "Choose one account, meeting, or planning block.",
        "Fill it with deidentified professional context only.",
        "Carry one commitment into the next field action.",
      ],
      inputHint: "Use professional account and territory context only—never patient information or PHI.",
      persistence: "Opening or downloading this resource does not add it to My Work or automatically sync the finished copy to another device.",
      reviewCheckpoint: "Before you leave the resource, identify the one commitment, owner, and date that make it actionable.",
      nextToolId: "playbooks",
    },
    script: {
      phase: "practice",
      job: "Rehearse the language before the live conversation.",
      outputPreview: "A practiced opening or response you can adapt and use in the next live conversation.",
      checklist: [
        "Pick the exact moment you expect to face.",
        "Practice one opening or response aloud.",
        "Adjust the wording after the real conversation.",
      ],
      inputHint: "Use deidentified professional context only—never patient details, clinical notes, or PHI.",
      persistence: "Opening or downloading this resource does not add it to My Work or automatically sync the finished copy to another device.",
      reviewCheckpoint: "Say the key line aloud and remove any wording that sounds generic, defensive, or outside your role.",
      nextToolId: "role-play",
    },
    checklist: {
      phase: "execute",
      job: "Move a real account or weekly commitment to a clear next step.",
      outputPreview: "A completed follow-through record with an owner, date, and next action.",
      checklist: [
        "Use it immediately before or after the field task.",
        "Mark the commitment kept, moved, or blocked.",
        "Capture the owner and date for follow-through.",
      ],
      inputHint: "Record professional follow-through only—never patient identifiers, clinical information, or PHI.",
      persistence: "Opening or downloading this resource does not add it to My Work or automatically sync the finished copy to another device.",
      reviewCheckpoint: "Confirm an accountable owner and due date instead of treating the checklist as complete on its own.",
      nextToolId: "sales-workflow",
    },
    guide: {
      phase: "review",
      job: "Turn a lesson into one change in the next field block.",
      outputPreview: "One specific behavior, phrase, or planning adjustment ready to test in the field.",
      checklist: [
        "Read for one situation you will face this week.",
        "Choose one behavior or phrase to try.",
        "Review what changed after the next conversation.",
      ],
      inputHint: "Use the guide with deidentified professional context only; never add patient information or PHI.",
      persistence: "Opening or downloading this resource does not add it to My Work or automatically sync the finished copy to another device.",
      reviewCheckpoint: "Choose one observable behavior to test, then revisit the guide after the next live conversation.",
      nextToolId: "weekly-plan",
    },
  };
  const fallback = guides[category] ?? guides.guide;
  const custom = input.workflow as Record<string, unknown> | null | undefined;
  const customJob = workflowText(custom?.job);
  const customExpectedOutput = workflowText(custom?.expectedOutput);
  const customReviewCheckpoint = workflowText(custom?.reviewCheckpoint);
  const requestedNextToolId = workflowText(custom?.nextToolId);
  const customNextToolId =
    requestedNextToolId && getToolById(requestedNextToolId)
      ? requestedNextToolId
      : undefined;
  const nextToolId =
    customNextToolId ??
    input.relatedToolIds?.find((id) => Boolean(getToolById(id))) ??
    fallback.nextToolId;
  return {
    ...fallback,
    job: customJob || fallback.job,
    outputPreview: customExpectedOutput || fallback.outputPreview,
    reviewCheckpoint: customReviewCheckpoint || fallback.reviewCheckpoint,
    nextToolId,
  };
}

/**
 * Native result handoffs are static routes and safe analytics identifiers.
 * They deliberately never accept generated output or member-entered context.
 */
export const MOBILE_FIELD_RESULT_ACTIONS = {
  playbooks: {
    toolId: "playbooks",
    actionId: "practice-hardest-moment",
    label: "Practice in Role-Play",
    description: "Choose the hardest moment in this plan and rehearse it before the next visit.",
    href: "/tool/roleplay",
    persistenceNote: "This playbook stays on screen for this session. Copy and Share do not save it or sync it to another device.",
  },
  objections: {
    toolId: "objections",
    actionId: "practice-objection",
    label: "Practice this objection in Role-Play",
    description: "Say the response aloud once, then pressure-test it before the next live conversation.",
    href: "/tool/roleplay",
    persistenceNote: "This talk track stays on screen for this session. Copy and Share do not save it or sync it to another device.",
  },
  "role-play": {
    toolId: "role-play",
    actionId: "open-command-center",
    label: "Open Sales Command Center",
    description: "Turn the phrase you practiced into one accountable follow-through step.",
    href: "/sales-workflow",
    persistenceNote: "Role-play feedback stays on screen for this session. Copy and Share do not save it or sync it to another device.",
  },
  "cold-call": {
    toolId: "cold-call",
    actionId: "practice-opening",
    label: "Practice opening in Role-Play",
    description: "Read the opening aloud once, then pressure-test the ask before you dial.",
    href: "/tool/roleplay",
    persistenceNote: "This script stays on screen for this session. Copy and Share do not save it or sync it to another device.",
  },
  "weekly-plan": {
    toolId: "weekly-plan",
    actionId: "open-command-center",
    label: "Open Sales Command Center",
    description: "Open your first account, run the Monday visit, and keep the week moving.",
    href: "/sales-workflow",
    persistenceNote: "This plan stays on screen for this session. Copy and Share do not save it or sync it to another device.",
  },
  "email-templates": {
    toolId: "email-templates",
    actionId: "practice-ask",
    label: "Practice the ask in Role-Play",
    description: "Review the draft, then rehearse the ask before you send it from your approved mail app.",
    href: "/tool/roleplay",
    persistenceNote: "This app does not send email. Copy opens the clipboard and Share opens the iPhone share sheet; a reminder only prompts you to send it.",
  },
  research: {
    toolId: "research",
    actionId: "build-playbook",
    label: "Build a Playbook from This Insight",
    description: "Turn one verified insight into a specific conversation plan before the next visit.",
    href: "/tool/playbook",
    persistenceNote: "Research stays on screen for this session. Copy and Share do not save it or sync it to another device.",
  },
  resources: {
    toolId: "resources",
    actionId: "open-tools",
    label: "Open field tools",
    description: "Choose a tool that prepares the conversation or follow-through for this resource.",
    href: "/(tabs)/tools",
    persistenceNote: "Download makes a local iPhone copy. Only resource details sync so you can find it again; the downloaded file does not move to another device.",
  },
} as const;

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
  type DiscoveryIntentSpec,
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

export {
  TOOL_ANATOMY_VERSION,
  TOOL_ANATOMY_SECTIONS,
  TOOL_ANATOMY_META,
  TOOL_ANATOMY_BY_ID,
  anatomySectionsForTool,
  toolUsesSection,
  normalizeSectionAlias,
  type ToolAnatomySectionId,
  type ToolAnatomySectionMeta,
} from "./tool-anatomy";

export {
  RELATED_RECS_VERSION,
  RELATED_EDGES,
  REQUIRED_RELATED_SOURCES,
  recommendRelated,
  recommendRelatedIncludingUnavailable,
  relatedToAnatomyItems,
  type RelatedEdge,
  type RelatedRecommendation,
  type RecommendContext,
  type RelatedSourceKind,
  type RelatedDestinationKind,
  type RequiredRelatedSource,
} from "./related-recommendations";

export {
  PRODUCT_OUTCOMES,
  PRODUCT_EVENT_TYPE,
  PRODUCT_METRICS,
  PRODUCT_EVENT_DEDUPE_MS,
  SAFE_METADATA_KEYS,
  SAFE_METADATA_VALUE_MAX,
  isProductOutcome,
  isIdempotentOutcome,
  sanitizeAnalyticsMetadata,
  productEventPayload,
  productEventDedupeKey,
  type ProductOutcome,
  type SafeMetadataKey,
  type SafeProductMetadata,
  type ProductMetricId,
} from "./product-analytics";

export {
  resolveEntitlementShell,
  entitlementShellCopy,
  formatHoursRemainingLabel,
  type EntitlementShellId,
  type EntitlementShellInput,
  type EntitlementShellCopy,
} from "./entitlement-shell";

export {
  API_CONTRACT_VERSION,
  MIN_IOS_APP_VERSION,
  MIN_WEB_APP_VERSION,
  PRODUCT_FEATURE_FLAG_KEYS,
  parseSemver,
  isVersionAtLeast,
  checkIosCompatibility,
  type DeployEnvironment,
  type ProductFeatureFlagKey,
  type CompatibilityCheck,
} from "./client-delivery";

export {
  RELEASE_PERSONAS,
  RELEASE_JOURNEYS,
  AUTOMATED_SUITES,
  LIVE_SMOKE_STACK,
  evaluateProductionReadyClaim,
  journeysForPersona,
  requiredDomainsCovered,
  type PersonaId,
  type JourneyDomain,
  type VerificationMode,
  type JourneyCheck,
  type AutomatedSuite,
  type GateVerdict,
} from "./release-gate";

export {
  ACTIVATION_VERSION,
  ACTIVATION_STEP_IDS,
  activationStepsForRole,
  evaluateActivation,
  normalizeActivationRole,
  isProgressDone,
  markActivationStep,
  withAutoActivationComplete,
  type ActivationJobRole,
  type ActivationStepId,
  type ActivationStepDef,
  type ActivationStepStatus,
  type ActivationView,
} from "./activation-loop";

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
