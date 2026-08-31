/**
 * Free public NPPES NPI Registry lookup (CMS).
 * No API key. Do not send PHI—only provider names / NPIs / organization names.
 */

export type NpiResult = {
  npi: string;
  name: string;
  credential?: string;
  taxonomy?: string;
  city?: string;
  state?: string;
  phone?: string;
  enumerationType?: string;
  status?: string;
  address?: string;
  postalCode?: string;
  taxonomies: string[];
  lastUpdated?: string;
  source: {
    label: "CMS NPPES NPI Registry";
    url: string;
    checkedAt: string;
  };
};

type NppesResponse = {
  result_count?: number;
  results?: Array<{
    number?: string;
    enumeration_type?: string;
    basic?: {
      first_name?: string;
      last_name?: string;
      organization_name?: string;
      credential?: string;
      status?: string;
      last_updated?: string;
    };
    taxonomies?: Array<{ desc?: string; primary?: boolean }>;
    addresses?: Array<{
      address_purpose?: string;
      city?: string;
      state?: string;
      telephone_number?: string;
      address_1?: string;
      address_2?: string;
      postal_code?: string;
    }>;
  }>;
};

function mapResult(r: NonNullable<NppesResponse["results"]>[number]): NpiResult | null {
  const npi = r.number?.trim();
  if (!npi) return null;
  const basic = r.basic || {};
  const name =
    basic.organization_name ||
    [basic.first_name, basic.last_name].filter(Boolean).join(" ").trim() ||
    "Unknown";
  const taxonomy =
    r.taxonomies?.find((t) => t.primary)?.desc || r.taxonomies?.[0]?.desc || undefined;
  const addr =
    r.addresses?.find((a) => a.address_purpose === "LOCATION") || r.addresses?.[0];
  const taxonomies = Array.from(
    new Set((r.taxonomies || []).map((item) => item.desc?.trim()).filter((item): item is string => Boolean(item))),
  );
  return {
    npi,
    name,
    credential: basic.credential || undefined,
    taxonomy,
    city: addr?.city,
    state: addr?.state,
    phone: addr?.telephone_number,
    enumerationType: r.enumeration_type,
    status: basic.status,
    address: [addr?.address_1, addr?.address_2].filter(Boolean).join(", ") || undefined,
    postalCode: addr?.postal_code,
    taxonomies,
    lastUpdated: basic.last_updated,
    source: {
      label: "CMS NPPES NPI Registry",
      url: `https://npiregistry.cms.hhs.gov/provider-view/${npi}`,
      checkedAt: new Date().toISOString(),
    },
  };
}

export async function searchNpiProviders(input: {
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  city?: string;
  state?: string;
  number?: string;
  limit?: number;
}): Promise<NpiResult[]> {
  const params = new URLSearchParams({ version: "2.1" });
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 10);
  params.set("limit", String(limit));

  if (input.number?.trim()) params.set("number", input.number.trim());
  if (input.firstName?.trim()) params.set("first_name", input.firstName.trim());
  if (input.lastName?.trim()) params.set("last_name", input.lastName.trim());
  if (input.organizationName?.trim()) {
    params.set("organization_name", input.organizationName.trim());
  }
  if (input.city?.trim()) params.set("city", input.city.trim());
  if (input.state?.trim()) params.set("state", input.state.trim().toUpperCase().slice(0, 2));

  // Require at least one meaningful search key
  if (
    !input.number &&
    !input.lastName &&
    !input.organizationName &&
    !(input.firstName && input.lastName)
  ) {
    throw new Error("Provide NPI number, last name, or organization name");
  }

  // Ask registry for a wider page, then filter client-side — NPPES fuzzy match is noisy.
  params.set("limit", String(Math.min(limit * 5, 50)));

  const fetchRegistry = async (query: URLSearchParams): Promise<NppesResponse> => {
    const url = `https://npiregistry.cms.hhs.gov/api/?${query.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`NPI registry returned ${res.status}`);
    return (await res.json()) as NppesResponse;
  };

  let data = await fetchRegistry(params);

  // NPPES occasionally returns an empty exact-name page even when a broad record
  // exists. Retry a name-only wildcard query, then apply state/city locally.
  if (!(data.results || []).length && !input.number?.trim()) {
    const broad = new URLSearchParams({ version: "2.1", limit: String(Math.min(limit * 10, 100)) });
    if (input.lastName?.trim()) broad.set("last_name", `${input.lastName.trim()}*`);
    if (input.firstName?.trim()) broad.set("first_name", `${input.firstName.trim()}*`);
    if (input.organizationName?.trim()) broad.set("organization_name", `${input.organizationName.trim()}*`);
    data = await fetchRegistry(broad);
  }

  let results = (data.results || [])
    .map(mapResult)
    .filter((x): x is NpiResult => Boolean(x));

  const last = input.lastName?.trim().toLowerCase();
  const first = input.firstName?.trim().toLowerCase();
  const org = input.organizationName?.trim().toLowerCase();
  const requestedState = input.state?.trim().toUpperCase().slice(0, 2);
  const requestedCity = input.city?.trim().toLowerCase();
  if (requestedState) results = results.filter((r) => r.state?.toUpperCase() === requestedState);
  if (requestedCity) results = results.filter((r) => r.city?.toLowerCase().includes(requestedCity));
  if (last || first || org) {
    results = results.filter((r) => {
      const name = r.name.toLowerCase();
      const parts = name.split(/[\s,]+/).filter(Boolean);
      if (org) return name.includes(org) || parts.some((p) => p.startsWith(org.slice(0, 4)));
      // Prefer last-name match (common registry noise when only city/state set).
      if (last && !parts.some((p) => p === last || p.startsWith(last))) return false;
      // First name is soft: only apply when present and no last-name word match alone.
      if (first && last) {
        const hasLast = parts.some((p) => p === last);
        const hasFirst = parts.some((p) => p === first || p.startsWith(first));
        if (hasLast && hasFirst) return true;
        if (hasLast) return true; // last name is the strong key
        return false;
      }
      if (first && !parts.some((p) => p === first || p.startsWith(first))) return false;
      return true;
    });
  }

  return results.slice(0, limit);
}
