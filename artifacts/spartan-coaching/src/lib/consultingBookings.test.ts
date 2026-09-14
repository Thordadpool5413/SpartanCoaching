import { describe, expect, it } from "vitest";
import { vi } from "vitest";

const { trackPublicFunnelEvent } = vi.hoisted(() => ({
  trackPublicFunnelEvent: vi.fn(),
}));

vi.mock("./publicFunnel", () => ({
  PUBLIC_FUNNEL_EVENT: {
    consultationBookingClick: "consultation_booking_click",
    consultationBookingSuccess: "consultation_booking_success",
    consultationBookingFallback: "consultation_booking_fallback",
    consultationBookingFailure: "consultation_booking_failure",
  },
  trackPublicFunnelEvent,
}));

import {
  CONSULTATION_BOOKING_EVENT,
  CONSULTATION_BOOKING_OUTCOME,
  CONSULTATION_BOOKING_SOURCE,
  getCalendlyConsultationUrl,
  getCalendlyFailureRedirectPath,
  getCalendlySuccessRedirectPath,
  trackConsultationBookingEvent,
} from "./consultingBookings";

describe("consultation booking pilot", () => {
  it("keeps redirects on the public contact route with one fixed token", () => {
    for (const [path, value] of [
      [getCalendlySuccessRedirectPath(), "booked"],
      [getCalendlyFailureRedirectPath(), "failed"],
    ] as const) {
      const redirect = new URL(path, "https://spartanhospicecoaching.com");
      expect(redirect.pathname).toBe("/contact");
      expect([...redirect.searchParams.keys()]).toEqual(["consultation"]);
      expect(redirect.searchParams.get("consultation")).toBe(value);
    }
  });

  it("keeps redirect tokens fixed and internal", () => {
    expect(getCalendlySuccessRedirectPath()).toBe("/contact?consultation=booked");
    expect(getCalendlyFailureRedirectPath()).toBe("/contact?consultation=failed");
  });

  it("does not expose an unapproved booking host", () => {
    const url = getCalendlyConsultationUrl(true);
    expect(url === null || new URL(url).hostname.endsWith("calendly.com")).toBe(true);
  });

  it("keeps the Access Desk path when the server pauses the pilot", () => {
    expect(getCalendlyConsultationUrl(false)).toBeNull();
  });

  it("emits only the fixed source and outcome vocabulary", () => {
    trackConsultationBookingEvent(
      CONSULTATION_BOOKING_EVENT.success,
      CONSULTATION_BOOKING_OUTCOME.success,
    );
    trackConsultationBookingEvent(
      CONSULTATION_BOOKING_EVENT.success,
      "contact-answer-with-field-work-content",
    );

    expect(trackPublicFunnelEvent).toHaveBeenCalledTimes(1);
    expect(trackPublicFunnelEvent).toHaveBeenCalledWith(
      CONSULTATION_BOOKING_EVENT.success,
      CONSULTATION_BOOKING_SOURCE,
      { outcome: CONSULTATION_BOOKING_OUTCOME.success },
    );
  });
});