const CONSULTATION_BOOKING_FLAG = "consultation_booking";

type ClientConfigResponse = {
  flags?: Record<string, boolean>;
};

/**
 * Read the server-owned delivery flag used by the public consultation pilot.
 * A missing, malformed, or unavailable response deliberately disables the
 * external handoff and leaves the Access Desk request as the fallback.
 */
export async function fetchConsultationBookingEnabled(): Promise<boolean> {
  try {
    const response = await fetch("/api/client-config", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const config = (await response.json()) as ClientConfigResponse;
    return config.flags?.[CONSULTATION_BOOKING_FLAG] === true;
  } catch {
    return false;
  }
}