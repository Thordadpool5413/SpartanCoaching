import { trackEvent } from "@/lib/analytics";
import type { SafeProductMetadata } from "@workspace/field-kit-catalog";

/**
 * Fixed, privacy-safe public marketing funnel vocabulary.
 *
 * The source values are short route/control tokens only. Names, emails, form
 * answers, search terms, and other prose must never enter analytics metadata.
 */
export const PUBLIC_FUNNEL_EVENT = {
  pageIntent: "page_intent",
  ctaClick: "cta_click",
  campaignClick: "campaign_click",
  toolPreviewStart: "tool_preview_start",
  contactStart: "contact_start",
  contactSubmit: "contact_submit",
  contactFailure: "contact_failure",
  membershipPlanSelection: "membership_plan_selection",
  appInterest: "app_interest",
  appHandoff: "app_handoff",
  workspaceHandoff: "workspace_handoff",
  consultationBookingClick: "consultation_booking_click",
  consultationBookingSuccess: "consultation_booking_success",
  consultationBookingFallback: "consultation_booking_fallback",
  consultationBookingFailure: "consultation_booking_failure",
} as const;

export type PublicFunnelEvent =
  (typeof PUBLIC_FUNNEL_EVENT)[keyof typeof PUBLIC_FUNNEL_EVENT];

export function trackPublicFunnelEvent(
  eventName: PublicFunnelEvent,
  source: string,
  metadata?: Omit<SafeProductMetadata, "source">,
): void {
  trackEvent("public_funnel", eventName, { source, ...metadata });
}