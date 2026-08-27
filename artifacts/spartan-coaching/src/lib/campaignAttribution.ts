import type { SafeProductMetadata } from "@workspace/field-kit-catalog";
import { trackPublicFunnelEvent, PUBLIC_FUNNEL_EVENT } from "@/lib/publicFunnel";

const CAMPAIGN_STORAGE_KEY = "hsp_campaign_attribution_v1";
const CAMPAIGN_CLICK_STORAGE_PREFIX = "hsp_campaign_click_recorded_v1:";

const CAMPAIGN = "hospice_sales_pro" as const;
const MEDIUM = "paid_social" as const;

export type CampaignAttribution = {
  source: "instagram" | "linkedin";
  medium: typeof MEDIUM;
  campaign: typeof CAMPAIGN;
  creative: "walk_in_prepared" | "make_field_coachable";
};

const SOURCES = new Set<CampaignAttribution["source"]>(["instagram", "linkedin"]);
const CREATIVES = new Set<CampaignAttribution["creative"]>([
  "walk_in_prepared",
  "make_field_coachable",
]);

/**
 * Only accept the exact campaign vocabulary used in the published ad links.
 * This prevents arbitrary query-string values from reaching analytics.
 */
export function parseCampaignAttribution(search: string): CampaignAttribution | null {
  const params = new URLSearchParams(search);
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  const creative = params.get("utm_content");

  if (
    !source ||
    !medium ||
    !campaign ||
    !creative ||
    !SOURCES.has(source as CampaignAttribution["source"]) ||
    medium !== MEDIUM ||
    campaign !== CAMPAIGN ||
    !CREATIVES.has(creative as CampaignAttribution["creative"])
  ) {
    return null;
  }

  return {
    source: source as CampaignAttribution["source"],
    medium,
    campaign,
    creative: creative as CampaignAttribution["creative"],
  };
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readStoredAttribution(): CampaignAttribution | null {
  if (!isBrowser()) return null;

  try {
    const stored = window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (!stored) return null;
    return parseCampaignAttribution(
      new URLSearchParams(JSON.parse(stored) as Record<string, string>).toString(),
    );
  } catch {
    return null;
  }
}

/** Remember only allow-listed campaign values for this browser session. */
export function rememberCampaignAttribution(search: string): CampaignAttribution | null {
  const attribution = parseCampaignAttribution(search);
  if (!attribution || !isBrowser()) return attribution;

  try {
    window.sessionStorage.setItem(
      CAMPAIGN_STORAGE_KEY,
      JSON.stringify({
        utm_source: attribution.source,
        utm_medium: attribution.medium,
        utm_campaign: attribution.campaign,
        utm_content: attribution.creative,
      }),
    );
  } catch {
    // Tracking remains best-effort if storage is unavailable.
  }
  return attribution;
}

export function getCampaignAttribution(): CampaignAttribution | null {
  if (!isBrowser()) return null;
  return parseCampaignAttribution(window.location.search) ?? readStoredAttribution();
}

function campaignMetadata(
  attribution: CampaignAttribution,
  extra?: Omit<SafeProductMetadata, "source" | "campaign" | "creative" | "platform">,
): SafeProductMetadata {
  return {
    source: attribution.source,
    platform: "web",
    campaign: attribution.campaign,
    creative: attribution.creative,
    ...extra,
  };
}

/**
 * Record a tagged campaign event with only fixed, non-sensitive labels.
 * No URL query value other than the allow-listed tuple is forwarded.
 */
export function trackCampaignFunnelEvent(
  eventName: "campaign_click" | "tool_preview_start",
  attribution: CampaignAttribution,
  extra?: Omit<SafeProductMetadata, "source" | "campaign" | "creative" | "platform">,
): void {
  trackPublicFunnelEvent(eventName, attribution.source, campaignMetadata(attribution, extra));
}

export function recordCampaignClickOnce(attribution: CampaignAttribution): boolean {
  if (!isBrowser()) return false;
  const key = `${CAMPAIGN_CLICK_STORAGE_PREFIX}${attribution.source}:${attribution.creative}`;
  try {
    if (window.sessionStorage.getItem(key) === "1") return false;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // If session storage is unavailable, allow the best-effort event.
  }
  trackCampaignFunnelEvent(PUBLIC_FUNNEL_EVENT.campaignClick, attribution);
  return true;
}