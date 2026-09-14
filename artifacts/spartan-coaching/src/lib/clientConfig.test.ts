import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchConsultationBookingEnabled } from "./clientConfig";

describe("web client config", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("enables consultation booking only when the server flag is true", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ flags: { consultation_booking: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(fetchConsultationBookingEnabled()).resolves.toBe(true);
  });

  it("fails closed to Access Desk when config is paused or unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ flags: { consultation_booking: false } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    await expect(fetchConsultationBookingEnabled()).resolves.toBe(false);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(fetchConsultationBookingEnabled()).resolves.toBe(false);
  });
});