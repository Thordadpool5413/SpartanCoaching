/**
 * Group Learn PDF resources by field use case (not flat dump).
 */
export type ResourceLike = {
  id: number;
  title: string;
  description?: string | null;
  fileUrl: string;
  category?: string | null;
};

export type ResourceGroupId = "visit_prep" | "week_plan" | "onboarding" | "other";

export const RESOURCE_GROUP_META: Record<
  ResourceGroupId,
  { title: string; blurb: string; order: number }
> = {
  visit_prep: {
    title: "Visit prep",
    blurb: "Scripts, objections, and call-ready sheets",
    order: 0,
  },
  week_plan: {
    title: "Week & territory",
    blurb: "Plans, trackers, and territory templates",
    order: 1,
  },
  onboarding: {
    title: "Onboarding & systems",
    blurb: "New-hire, process, and training guides",
    order: 2,
  },
  other: {
    title: "More downloads",
    blurb: "Additional field resources",
    order: 3,
  },
};

function classify(resource: ResourceLike): ResourceGroupId {
  const blob = `${resource.title} ${resource.description || ""} ${resource.category || ""}`.toLowerCase();

  if (
    /object|script|call|cold|email|follow|conversation|difficult|facility|physician|lunch|eligibility|decision/.test(
      blob,
    )
  ) {
    return "visit_prep";
  }
  if (/week|territor|activity|tracker|plan|metric|dashboard|profit|roi|rep cost/.test(blob)) {
    return "week_plan";
  }
  if (/onboard|new.?hire|training|regulat|guide|framework|case study|baa|compliance/.test(blob)) {
    return "onboarding";
  }
  return "other";
}

export function groupResources(resources: ResourceLike[]): {
  id: ResourceGroupId;
  title: string;
  blurb: string;
  items: ResourceLike[];
}[] {
  const buckets: Record<ResourceGroupId, ResourceLike[]> = {
    visit_prep: [],
    week_plan: [],
    onboarding: [],
    other: [],
  };
  for (const r of resources) {
    buckets[classify(r)].push(r);
  }
  return (Object.keys(RESOURCE_GROUP_META) as ResourceGroupId[])
    .sort((a, b) => RESOURCE_GROUP_META[a].order - RESOURCE_GROUP_META[b].order)
    .filter((id) => buckets[id].length > 0)
    .map((id) => ({
      id,
      title: RESOURCE_GROUP_META[id].title,
      blurb: RESOURCE_GROUP_META[id].blurb,
      items: buckets[id],
    }));
}
