import {
  CONSULTATION_BOOKING_EVENT,
  CONSULTATION_BOOKING_OUTCOME,
  CONSULTATION_BOOKING_SOURCE,
  trackConsultationBookingEvent,
} from "@/lib/consultingBookings";
import React from "react";
import { trackMobileEvent } from "@/lib/analytics";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import ConsultingScheduleScreen from "../app/consulting-schedule";

jest.mock("@/lib/analytics", () => ({
  trackMobileEvent: jest.fn().mockResolvedValue(undefined),
}));

const mockFetchClientConfig = jest.fn();
const mockGetCalendlyConsultationUrl = jest.fn();
const mockRouterBack = jest.fn();

jest.mock("@/lib/clientConfig", () => ({
  fetchClientConfig: (...args: unknown[]) => mockFetchClientConfig(...args),
  getCachedClientConfig: jest.fn(() => null),
}));

jest.mock("@/lib/consultingBookings", () => ({
  ...jest.requireActual("@/lib/consultingBookings"),
  getCalendlyConsultationUrl: (...args: unknown[]) =>
    mockGetCalendlyConsultationUrl(...args),
}));

jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    background: "#ffffff",
    borderStrong: "#dddddd",
    foreground: "#111111",
    mutedForeground: "#555555",
    primary: "#111111",
    primaryForeground: "#ffffff",
    primaryMuted: "#eeeeee",
    readablePrimary: "#111111",
  }),
}));

jest.mock("expo-router", () => ({
  router: { back: (...args: unknown[]) => mockRouterBack(...args) },
}));

jest.mock("react-native-webview", () => ({
  WebView: "WebView",
}));

describe("Calendly release smoke contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchClientConfig.mockResolvedValue(null);
    mockGetCalendlyConsultationUrl.mockReturnValue(null);
  });

  it("keeps the booking success attributable to the saved Access Desk request", () => {
    trackConsultationBookingEvent(
      CONSULTATION_BOOKING_EVENT.success,
      CONSULTATION_BOOKING_OUTCOME.success,
    );

    expect(trackMobileEvent).toHaveBeenCalledWith(
      "public_funnel",
      CONSULTATION_BOOKING_EVENT.success,
      {
        metadata: {
          source: CONSULTATION_BOOKING_SOURCE,
          outcome: CONSULTATION_BOOKING_OUTCOME.success,
        },
      },
    );
  });

  it("drops contact answers and field-work content instead of tracking them", () => {
    trackConsultationBookingEvent(
      CONSULTATION_BOOKING_EVENT.success,
      "Jane Smith shared a private field-work draft",
    );
    trackConsultationBookingEvent(
      CONSULTATION_BOOKING_EVENT.failure,
      "patient-name@example.com",
    );

    expect(trackMobileEvent).not.toHaveBeenCalled();
  });

  it("uses fixed recovery outcomes for disabled and failed scheduling", () => {
    trackConsultationBookingEvent(
      CONSULTATION_BOOKING_EVENT.fallback,
      CONSULTATION_BOOKING_OUTCOME.fallbackDisabled,
    );
    trackConsultationBookingEvent(
      CONSULTATION_BOOKING_EVENT.failure,
      CONSULTATION_BOOKING_OUTCOME.failureWebView,
    );

    expect(trackMobileEvent).toHaveBeenNthCalledWith(
      1,
      "public_funnel",
      CONSULTATION_BOOKING_EVENT.fallback,
      {
        metadata: {
          source: CONSULTATION_BOOKING_SOURCE,
          outcome: CONSULTATION_BOOKING_OUTCOME.fallbackDisabled,
        },
      },
    );
    expect(trackMobileEvent).toHaveBeenNthCalledWith(
      2,
      "public_funnel",
      CONSULTATION_BOOKING_EVENT.failure,
      {
        metadata: {
          source: CONSULTATION_BOOKING_SOURCE,
          outcome: CONSULTATION_BOOKING_OUTCOME.failureWebView,
        },
      },
    );
  });

  it("renders the Access Desk recovery when the scheduling link is disabled", async () => {
    render(React.createElement(ConsultingScheduleScreen));

    await waitFor(() => {
      expect(screen.getByTestId("consulting-schedule-unavailable")).toBeTruthy();
    });

    expect(
      screen.getByText(
        "Your Access Desk request is still saved. Spartan Coaching will confirm an exact time directly.",
      ),
    ).toBeTruthy();
    expect(screen.getByTestId("consulting-schedule-return")).toBeTruthy();
    expect(trackMobileEvent).toHaveBeenCalledWith(
      "public_funnel",
      CONSULTATION_BOOKING_EVENT.fallback,
      expect.objectContaining({
        metadata: expect.objectContaining({
          outcome: CONSULTATION_BOOKING_OUTCOME.fallbackDisabled,
        }),
      }),
    );
  });

  it("renders the Access Desk recovery after a WebView failure", async () => {
    mockGetCalendlyConsultationUrl.mockReturnValue("https://calendly.com/spartan/consult");

    render(React.createElement(ConsultingScheduleScreen));

    const webView = await waitFor(() =>
      screen.getByTestId("consulting-schedule-webview"),
    );
    fireEvent(webView, "error");

    await waitFor(() => {
      expect(screen.getByTestId("consulting-schedule-unavailable")).toBeTruthy();
    });

    expect(
      screen.getByText(
        "Your Access Desk request is still saved. Spartan Coaching will confirm an exact time directly.",
      ),
    ).toBeTruthy();
    expect(trackMobileEvent).toHaveBeenCalledWith(
      "public_funnel",
      CONSULTATION_BOOKING_EVENT.failure,
      expect.objectContaining({
        metadata: expect.objectContaining({
          outcome: CONSULTATION_BOOKING_OUTCOME.failureWebView,
        }),
      }),
    );
  });
});