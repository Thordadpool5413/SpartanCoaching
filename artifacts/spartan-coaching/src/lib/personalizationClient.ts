/**
 * Client for HSP-37 personalization API.
 */

export type PersonalizationView = {
  version: string;
  payload: {
    schemaVersion: 1;
    favorites: { tools: string[]; resources: string[] };
    pinnedTools: string[];
    pinnedResources: string[];
    recent: Array<{
      kind: string;
      id: string;
      title: string;
      href: string;
      at: string;
    }>;
    dismissedRecommendationIds: string[];
  };
  continueItems: Array<{
    id: string;
    kind: string;
    title: string;
    href: string;
    why: string;
  }>;
  recommendedToday: Array<{
    id: string;
    title: string;
    href: string;
    why: string;
    source: string;
  }>;
  emptyHistory: boolean;
};

export async function fetchPersonalization(): Promise<PersonalizationView> {
  const res = await fetch("/api/v1/personalization", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load personalization");
  return res.json();
}

export async function recordPersonalizationEvent(body: {
  action: string;
  item?: { kind?: string; id: string; title?: string; href?: string };
}): Promise<PersonalizationView> {
  const res = await fetch("/api/v1/personalization/events", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to record personalization event");
  return res.json();
}

export async function updatePersonalization(body: {
  reset?: boolean;
  clearRecent?: boolean;
  dismissRecommendationId?: string;
  favorites?: { tools?: string[]; resources?: string[] };
  pinnedTools?: string[];
  pinnedResources?: string[];
}): Promise<PersonalizationView> {
  const res = await fetch("/api/v1/personalization", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update personalization");
  return res.json();
}
