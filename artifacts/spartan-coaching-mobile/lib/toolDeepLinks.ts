/**
 * Deep-link map: legacy tools?tab= → /tool/[tab] routes.
 */
import type { ToolTab } from "@/lib/toolTabs";
import { VALID_TABS } from "@/lib/toolTabs";

export function isToolTab(value: string | undefined | null): value is ToolTab {
  return !!value && VALID_TABS.has(value as ToolTab);
}

/** Params for expo-router — prefer dedicated tool screen. */
export function toolTabParams(tab: ToolTab): {
  pathname: "/tool/[tab]";
  params: { tab: ToolTab };
} {
  return {
    pathname: "/tool/[tab]",
    params: { tab },
  };
}

export function openToolHref(tab: ToolTab): {
  pathname: string;
  params?: Record<string, string>;
} {
  return {
    pathname: "/tool/[tab]",
    params: { tab },
  };
}

/** Catalog tool id → native tab when applicable */
export const CATALOG_ID_TO_TAB: Record<string, ToolTab> = {
  objections: "objection",
  playbooks: "playbook",
  "email-templates": "email",
  "role-play": "roleplay",
  research: "research",
  "weekly-plan": "weekly",
  "cold-call": "cold",
};
