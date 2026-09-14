import { trackMobileEvent } from "@/lib/analytics";
import {
  CONSULTATION_BOOKING_FLAG,
  isFlagEnabled,
} from "@/lib/clientConfig";

const CALENDLY_HOST = "calendly.com";
const CALENDLY_URL = process.env.EXPO_PUBLIC_CALENDLY_CONSULTATION_URL?.trim() || "";
const CALENDLY_ENABLED =
  process.env.EXPO_PUBLIC_CALENDLY_CONSULTATION_ENABLED?.trim().toLowerCase() !==
  "false";

export const CONSULTATION_BOOKING_EVENT = {
  click: "consultation_booking_click",
  success: "consultation_booking_success",
  fallback: "consultation_booking_fallback",
  failure: "consultation_booking_failure",
} as const;

export const CONSULTATION_BOOKING_SOURCE = "mobile_consulting_schedule" as const;

export const CONSULTATION_BOOKING_OUTCOME = {
  click: "schedule_opened",
  success: "user_confirmed",
  fallbackDisabled: "pilot_disabled_or_unconfigured",
  fallbackSelected: "access_desk_selected",
  failureWebView: "webview_error",
  failureHttp: "http_error",
} as const;

type ConsultationBookingEvent =
  (typeof CONSULTATION_BOOKING_EVENT)[keyof typeof CONSULTATION_BOOKING_EVENT];

const ALLOWED_OUTCOMES: Record<ConsultationBookingEvent, readonly string[]> = {
  [CONSULTATION_BOOKING_EVENT.click]: [CONSULTATION_BOOKING_OUTCOME.click],
  [CONSULTATION_BOOKING_EVENT.success]: [CONSULTATION_BOOKING_OUTCOME.success],
  [CONSULTATION_BOOKING_EVENT.fallback]: [
    CONSULTATION_BOOKING_OUTCOME.fallbackDisabled,
    CONSULTATION_BOOKING_OUTCOME.fallbackSelected,
  ],
  [CONSULTATION_BOOKING_EVENT.failure]: [
    CONSULTATION_BOOKING_OUTCOME.failureWebView,
    CONSULTATION_BOOKING_OUTCOME.failureHttp,
  ],
};

function isCalendlyHost(hostname: string): boolean {
  return hostname === CALENDLY_HOST || hostname.endsWith(`.${CALENDLY_HOST}`);
}

export function getCalendlyConsultationUrl(): string | null {
  // The server flag is intentionally fail-closed. Until client-config has
  // loaded, the existing Access Desk path remains the recovery path.
  if (
    !CALENDLY_ENABLED ||
    !CALENDLY_URL ||
    !isFlagEnabled(CONSULTATION_BOOKING_FLAG, false)
  ) {
    return null;
  }
  try {
    const url = new URL(CALENDLY_URL);
    if (url.protocol !== "https:" || !isCalendlyHost(url.hostname)) return null;
    url.searchParams.set("utm_source", "spartan_coaching");
    url.searchParams.set("utm_medium", "mobile_consulting");
    url.searchParams.set("utm_campaign", "consultation_pilot");
    return url.toString();
  } catch {
    return null;
  }
}

export function trackConsultationBookingEvent(
  eventName: ConsultationBookingEvent,
  outcome: string,
): void {
  if (!ALLOWED_OUTCOMES[eventName].includes(outcome)) return;

  void trackMobileEvent("public_funnel", eventName, {
    metadata: { source: CONSULTATION_BOOKING_SOURCE, outcome },
  });
}
