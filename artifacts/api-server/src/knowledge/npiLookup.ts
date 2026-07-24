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
    };
    taxonomies?: Array<{ desc?: string; primary?: boolean }>;
    addresses?: Array<{
      address_purpose?: string;
      city?: string;
      state?: string;
      telephone_number?: string;
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
  return {
    npi,
    name,
    credential: basic.credential || undefined,
    taxonomy,
    city: addr?.city,
    state: addr?.state,
    phone: addr?.telephone_number,
    enumerationType: r.enumeration_type,
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

  const url = `https://npiregistry.cms.hhs.gov/api/?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    throw new Error(`NPI registry returned ${res.status}`);
  }
  const data = (await res.json()) as NppesResponse;
  const results = (data.results || [])
    .map(mapResult)
    .filter((x): x is NpiResult => Boolean(x));
  return results.slice(0, limit);
}
