/** Ops note / email templates for Access Desk speed. */

export const DEFAULT_TRIAL_HOURS = {
  individual: 24,
  company: 72,
} as const;

export type NoteTemplate = {
  id: string;
  label: string;
  body: string;
};

export const REJECT_NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "not-fit",
    label: "Not a fit right now",
    body: "Thanks for your interest. Based on timing and fit, we are not opening an evaluation seat right now. Happy to talk coaching or revisit tools later.",
  },
  {
    id: "coaching-first",
    label: "Coaching first",
    body: "We think a strategy / coaching conversation is the better first step than a tool evaluation. Please book a call and we will pick this back up after.",
  },
  {
    id: "incomplete",
    label: "Need more context",
    body: "We need a bit more context on role, market, and what you are trying to improve before we can open evaluation access. Reply to this thread or book a short call.",
  },
  {
    id: "capacity",
    label: "At capacity",
    body: "We are at evaluation capacity this week. Please book a strategy call or request again next week and we will prioritize you.",
  },
];

export const ORG_NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "approved",
    label: "Approved / kicked off",
    body: "Approved evaluation. Set-password email sent. Watching for activation (password set + first tool use).",
  },
  {
    id: "mid-trial",
    label: "Mid-trial check",
    body: "Mid-trial: reached out / will reach out. Goal = one objection + weekly plan + debrief booked.",
  },
  {
    id: "expired-follow",
    label: "Trial ended — follow up",
    body: "Trial ended. Individual: point to Account Subscribe $14.99/wk. Team: debrief + corporate contract seats.",
  },
  {
    id: "won",
    label: "Won / activated",
    body: "Activated as continuing client (self-serve weekly or corporate contract). Hospice Sales Pro email / Stripe as applicable.",
  },
  {
    id: "lost",
    label: "Lost",
    body: "Lost: timing / budget / not a priority. Left door open for coaching later.",
  },
  {
    id: "extended",
    label: "Extended trial",
    body: "Extended evaluation window. Member notified by email. Still pushing debrief before window closes.",
  },
];

export function defaultHoursForType(type: string): number {
  return type === "company" ? DEFAULT_TRIAL_HOURS.company : DEFAULT_TRIAL_HOURS.individual;
}

export function siteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://spartancoaching.com";
}

export function loginUrl(): string {
  return `${siteOrigin()}/login`;
}

export function requestAccessUrl(): string {
  return `${siteOrigin()}/request-access`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

/** ISO local datetime string for <input type="datetime-local"> */
export function followUpPreset(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setMinutes(0, 0, 0);
  // datetime-local wants local YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
