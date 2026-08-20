const MICROSOFT_BOOKINGS_URL = process.env.EXPO_PUBLIC_MICROSOFT_BOOKINGS_URL?.trim() || "";

export function getMicrosoftBookingsUrl(): string | null {
  if (!MICROSOFT_BOOKINGS_URL) return null;
  try {
    const url = new URL(MICROSOFT_BOOKINGS_URL);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
