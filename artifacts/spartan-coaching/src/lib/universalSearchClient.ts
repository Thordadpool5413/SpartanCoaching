/**
 * Client for GET /api/v1/search (HSP-36).
 */

export type UniversalSearchHit = {
  id: string;
  type: string;
  title: string;
  snippet: string;
  href: string;
  mobileHref?: string;
  score: number;
  group: string;
};

export type UniversalSearchGroup = {
  type: string;
  label: string;
  hits: UniversalSearchHit[];
};

export type UniversalSearchResponse = {
  version: string;
  query: string;
  groups: UniversalSearchGroup[];
  total: number;
};

export async function fetchUniversalSearch(
  query: string,
  limit = 24,
): Promise<UniversalSearchResponse> {
  const q = query.trim();
  if (q.length < 2) {
    return { version: "universal-search-v1", query: q, groups: [], total: 0 };
  }
  const res = await fetch(
    `/api/v1/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    { credentials: "include" },
  );
  if (res.status === 401) {
    throw new Error("UNAUTHENTICATED");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Search failed");
  }
  return res.json() as Promise<UniversalSearchResponse>;
}

/** Flatten groups for simple combobox UIs. */
export function flattenSearchHits(
  data: UniversalSearchResponse,
): UniversalSearchHit[] {
  return data.groups.flatMap((g) => g.hits);
}
