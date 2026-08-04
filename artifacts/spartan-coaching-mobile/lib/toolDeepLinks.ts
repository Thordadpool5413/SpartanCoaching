/**
 * Deep-link map: legacy tools?tab= → stable tool routes / tabs.
 * Keep checklist + Home next-action links working when Tools splits.
 */
import type { ToolTab } from "@/lib/toolTabs";

export const TAB_TO_TOOL_PATH: Record<ToolTab, string> = {
  objection: "/(tabs)/tools",
  playbook: "/(tabs)/tools",
  email: "/(tabs)/tools",
  roleplay: "/(tabs)/tools",
  research: "/(tabs)/tools",
  weekly: "/(tabs)/tools",
  cold: "/(tabs)/tools",
};

/** Params for expo-router while tools remain embedded in the Tools tab. */
export function toolTabParams(tab: ToolTab): { pathname: "/(tabs)/tools"; params: { tab: ToolTab } } {
  return {
    pathname: "/(tabs)/tools",
    params: { tab },
  };
}

/**
 * Future native routes (I3). Prefer this helper so call sites migrate once.
 * Today: still Tools tab with tab param.
 */
export function openToolHref(tab: ToolTab): { pathname: string; params?: Record<string, string> } {
  return {
    pathname: "/(tabs)/tools",
    params: { tab },
  };
}
