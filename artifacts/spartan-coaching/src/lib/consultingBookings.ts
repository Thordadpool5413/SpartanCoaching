import {
  PUBLIC_FUNNEL_EVENT,
  trackPublicFunnelEvent,
  type PublicFunnelEvent,
} from "./publicFunnel";

const CALENDLY_HOST = "calendly.com";
const CALENDLY_URL = import.meta.env.VITE_CALENDLY_CONSULTATION_URL?.trim() || "";
const CALENDLY_ENABLED =
  import.meta.env.VITE_CALENDLY_CONSULTATION_ENABLED?.trim().toLowerCase() !==
  "false";
export const CONSULTATION_BOOKING_FLAG = "consultation_booking" as const;

export const CONSULTATION_BOOKING_EVENT = {
  click: PUBLIC_FUNNEL_EVENT.consultationBookingClick,
  success: PUBLIC_FUNNEL_EVENT.consultationBookingSuccess,
  fallback: PUBLIC_FUNNEL_EVENT.consultationBookingFallback,
  failure: PUBLIC_FUNNEL_EVENT.consultationBookingFailure,
} as const;

export const CONSULTATION_BOOKING_SOURCE = "public_contact" as const;

export const CONSULTATION_BOOKING_OUTCOME = {
  click: "calendly_opened",
  success: "calendly_confirmed",
  fallbackPrimary: "access_desk_primary",
  fallbackSelected: "access_desk_selected",
  failure: "calendly_returned_failure",
} as const;

type ConsultationBookingEvent =
  (typeof CONSULTATION_BOOKING_EVENT)[keyof typeof CONSULTATION_BOOKING_EVENT];

const ALLOWED_OUTCOMES: Record<ConsultationBookingEvent, readonly string[]> = {
  [CONSULTATION_BOOKING_EVENT.click]: [CONSULTATION_BOOKING_OUTCOME.click],
  [CONSULTATION_BOOKING_EVENT.success]: [CONSULTATION_BOOKING_OUTCOME.success],
  [CONSULTATION_BOOKING_EVENT.fallback]: [
    CONSULTATION_BOOKING_OUTCOME.fallbackPrimary,
    CONSULTATION_BOOKING_OUTCOME.fallbackSelected,
  ],
  [CONSULTATION_BOOKING_EVENT.failure]: [CONSULTATION_BOOKING_OUTCOME.failure],
};

function isCalendlyHost(hostname: string): boolean {
  return hostname === CALENDLY_HOST || hostname.endsWith(`.${CALENDLY_HOST}`);
}

/**
 * Return the single owner-approved consultation event type, if the pilot is
 * enabled. Only Calendly hosts are accepted so a misconfigured public URL
 * cannot send a visitor to an unapproved service.
 */
export function getCalendlyConsultationUrl(serverEnabled = false): string | null {
  // The server flag is intentionally fail-closed. If client-config is
  // unavailable, keep the existing Access Desk path instead of handing off.
  if (!CALENDLY_ENABLED || !CALENDLY_URL || !serverEnabled) return null;

  try {
    const url = new URL(CALENDLY_URL);
    if (url.protocol !== "https:" || !isCalendlyHost(url.hostname)) return null;

    url.searchParams.set("utm_source", "spartan_coaching");
    url.searchParams.set("utm_medium", "public_consultation");
    url.searchParams.set("utm_campaign", "consultation_pilot");
    return url.toString();
  } catch {
    return null;
  }
}

export function getCalendlySuccessRedirectPath(): string {
  return "/contact?consultation=booked";
}

export function getCalendlyFailureRedirectPath(): string {
  return "/contact?consultation=failed";
}

/**
 * Record only the fixed public consultation vocabulary. In particular, never
 * pass contact answers, field-work content, or arbitrary Calendly text through
 * the public funnel metadata.
 */
export function trackConsultationBookingEvent(
  eventName: PublicFunnelEvent,
  outcome: string,
): void {
  const allowed = ALLOWED_OUTCOMES[eventName as ConsultationBookingEvent];
  if (!allowed?.includes(outcome)) return;

  trackPublicFunnelEvent(eventName, CONSULTATION_BOOKING_SOURCE, { outcome });
}