import { describe, expect, it, vi } from "vitest";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));

vi.mock("@/lib/analytics", () => ({ trackEvent }));

import { PUBLIC_FUNNEL_EVENT, trackPublicFunnelEvent } from "./publicFunnel";

describe("public funnel analytics", () => {
  it("uses fixed event names and bounded source metadata", () => {
    trackPublicFunnelEvent(PUBLIC_FUNNEL_EVENT.appInterest, "handoff_app_store");

    expect(trackEvent).toHaveBeenCalledWith("public_funnel", "app_interest", {
      source: "handoff_app_store",
    });
  });
});