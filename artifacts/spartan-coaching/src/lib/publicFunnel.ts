import { trackEvent } from "@/lib/analytics";

/**
 * Fixed, privacy-safe public marketing funnel vocabulary.
 *
 * The source values are short route/control tokens only. Names, emails, form
 * answers, search terms, and other prose must never enter analytics metadata.
 */
export const PUBLIC_FUNNEL_EVENT = {
  ctaClick: "cta_click",
  contactStart: "contact_start",
  contactFailure: "contact_failure",
  appInterest: "app_interest",
} as const;

export type PublicFunnelEvent =
  (typeof PUBLIC_FUNNEL_EVENT)[keyof typeof PUBLIC_FUNNEL_EVENT];

export function trackPublicFunnelEvent(
  eventName: PublicFunnelEvent,
  source: string,
): void {
  trackEvent("public_funnel", eventName, { source });
}