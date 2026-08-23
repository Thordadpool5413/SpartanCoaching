import { trackEvent } from "@/lib/analytics";

/**
 * Fixed, privacy-safe public marketing funnel vocabulary.
 *
 * The source values are short route/control tokens only. Names, emails, form
 * answers, search terms, and other prose must never enter analytics metadata.
 */
export const PUBLIC_FUNNEL_EVENT = {
  pageIntent: "page_intent",
  ctaClick: "cta_click",
  contactStart: "contact_start",
  contactSubmit: "contact_submit",
  contactFailure: "contact_failure",
  membershipPlanSelection: "membership_plan_selection",
  appInterest: "app_interest",
  appHandoff: "app_handoff",
} as const;

export type PublicFunnelEvent =
  (typeof PUBLIC_FUNNEL_EVENT)[keyof typeof PUBLIC_FUNNEL_EVENT];

export function trackPublicFunnelEvent(
  eventName: PublicFunnelEvent,
  source: string,
): void {
  trackEvent("public_funnel", eventName, { source });
}