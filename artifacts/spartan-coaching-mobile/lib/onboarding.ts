export type ChecklistId = "objection" | "weekly_plan" | "roleplay" | "debrief" | "director_scorecard";

export type ChecklistDef = {
  id: ChecklistId;
  title: string;
  desc: string;
  toolTab?: "objection" | "playbook" | "email" | "roleplay";
  route?: string;
  roles?: Array<"rep" | "director" | "vp" | "owner" | "other">;
};

export const CHECKLIST: ChecklistDef[] = [
  {
    id: "objection",
    title: "Handle one real objection",
    desc: "Paste a live objection and get a field-ready response.",
    toolTab: "objection",
  },
  {
    id: "weekly_plan",
    title: "Build this week’s plan",
    desc: "Open tools and run Weekly Plan on web, or practice objections first in-app.",
    toolTab: "playbook",
  },
  {
    id: "roleplay",
    title: "Role-play your toughest scenario",
    desc: "Practice before you walk into the building.",
    toolTab: "roleplay",
  },
  {
    id: "director_scorecard",
    title: "Activity / scorecard math",
    desc: "Translate goals into daily conversations (best on web calculators).",
    route: "/staffing",
    roles: ["director", "vp", "owner"],
  },
  {
    id: "debrief",
    title: "Book a debrief call",
    desc: "Talk through what you are seeing while evaluation is open.",
    route: "/(tabs)/contact",
  },
];

export const START_HERE: Record<string, { title: string; blurb: string; toolTab?: string; route?: string }> = {
  rep: {
    title: "Start with objections",
    blurb: "Reps win the week on live conversations.",
    toolTab: "objection",
  },
  director: {
    title: "Start with a playbook",
    blurb: "Leaders set the message, then coach the team.",
    toolTab: "playbook",
  },
  vp: {
    title: "Start with staffing economics",
    blurb: "Connect growth pressure to the model, then coach execution.",
    route: "/staffing",
  },
  owner: {
    title: "Start with branch staffing",
    blurb: "See census and payroll pressure, then align the team.",
    route: "/staffing",
  },
  other: {
    title: "Open AI Tools",
    blurb: "Browse the Field Kit and mark checklist items as you go.",
    toolTab: "objection",
  },
};

export function isChecklistDone(
  progress: Record<string, boolean | string> | undefined,
  id: string,
): boolean {
  if (!progress) return false;
  const v = progress[id];
  return v === true || (typeof v === "string" && v.length > 0);
}

export function formatTrialRemaining(hours: number | null | undefined): string | null {
  if (hours == null) return null;
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `${mins}m left in evaluation`;
  }
  if (hours < 48) return `${Math.round(hours)}h left in evaluation`;
  return `${Math.round(hours / 24)}d left in evaluation`;
}

export function visibleChecklist(jobRole?: string | null): ChecklistDef[] {
  const role = (jobRole || "") as ChecklistDef["roles"] extends (infer R)[] | undefined ? R : string;
  return CHECKLIST.filter((item) => {
    if (!item.roles?.length) return true;
    if (!jobRole) return item.id !== "director_scorecard";
    return item.roles.includes(role as any);
  });
}
