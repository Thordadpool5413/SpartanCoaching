import { beforeEach, describe, expect, it, vi } from "vitest";

const { trackPublicFunnelEvent } = vi.hoisted(() => ({
  trackPublicFunnelEvent: vi.fn(),
}));

vi.mock("@/lib/publicFunnel", () => ({
  PUBLIC_FUNNEL_EVENT: {
    campaignClick: "campaign_click",
    toolPreviewStart: "tool_preview_start",
  },
  trackPublicFunnelEvent,
}));

import {
  getCampaignAttribution,
  parseCampaignAttribution,
  recordCampaignClickOnce,
  rememberCampaignAttribution,
} from "./campaignAttribution";

const INSTAGRAM_SEARCH =
  "?utm_source=instagram&utm_medium=paid_social&utm_campaign=hospice_sales_pro&utm_content=walk_in_prepared";

describe("campaign attribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/tools");
  });

  it("accepts the published Instagram tuple", () => {
    expect(parseCampaignAttribution(INSTAGRAM_SEARCH)).toEqual({
      source: "instagram",
      medium: "paid_social",
      campaign: "hospice_sales_pro",
      creative: "walk_in_prepared",
    });
  });

  it("ignores extra parameters and rejects unknown or incomplete campaign values", () => {
    expect(parseCampaignAttribution(`${INSTAGRAM_SEARCH}&utm_term=patient_name`)).not.toBeNull();
    expect(
      parseCampaignAttribution(
        "?utm_source=instagram&utm_medium=paid_social&utm_campaign=other&utm_content=walk_in_prepared",
      ),
    ).toBeNull();
    expect(parseCampaignAttribution("?utm_source=instagram&utm_campaign=hospice_sales_pro")).toBeNull();
  });

  it("remembers only safe attribution and reads it after navigation", () => {
    expect(rememberCampaignAttribution(INSTAGRAM_SEARCH)?.source).toBe("instagram");
    window.history.replaceState({}, "", "/tools/objections");
    expect(getCampaignAttribution()?.creative).toBe("walk_in_prepared");
  });

  it("records one campaign click per platform and creative per session", () => {
    const attribution = parseCampaignAttribution(INSTAGRAM_SEARCH)!;
    expect(recordCampaignClickOnce(attribution)).toBe(true);
    expect(recordCampaignClickOnce(attribution)).toBe(false);
    expect(trackPublicFunnelEvent).toHaveBeenCalledTimes(1);
    expect(trackPublicFunnelEvent).toHaveBeenCalledWith("campaign_click", "instagram", {
      source: "instagram",
      platform: "web",
      campaign: "hospice_sales_pro",
      creative: "walk_in_prepared",
    });
  });
});