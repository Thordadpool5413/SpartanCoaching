const DATASET_ID = "a6a063c5-3d7c-463c-b914-07b8409ca8fd";
const DATASET_URL = `https://data.cms.gov/data-api/v1/dataset/${DATASET_ID}/data`;
const DATASET_PAGE = "https://data.cms.gov/provider-data/dataset/252m-zfp9";

type CmsHospiceRow = Record<string, unknown>;

export type HospiceOrganization = {
  npi: string;
  ccn: string;
  organizationName: string;
  doingBusinessAs: string;
  city: string;
  state: string;
  zipCode: string;
  ownership: "For profit" | "Nonprofit" | "Unknown";
  organizationStructure: string;
  source: { label: "CMS Hospice enrollment data"; url: string; checkedAt: string };
};

function text(row: CmsHospiceRow, key: string): string {
  return typeof row[key] === "string" ? String(row[key]).trim() : "";
}

export async function searchCmsHospices(input: { state: string; city?: string; limit?: number }): Promise<HospiceOrganization[]> {
  const state = input.state.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(state)) throw new Error("State must use the two letter abbreviation.");
  const limit = Math.max(1, Math.min(input.limit || 25, 50));
  const url = new URL(DATASET_URL);
  url.searchParams.set("filter[STATE]", state);
  if (input.city?.trim()) url.searchParams.set("filter[CITY]", input.city.trim().toUpperCase());
  url.searchParams.set("size", String(limit));
  url.searchParams.set("offset", "0");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("CMS hospice data is temporarily unavailable.");
    const rows = await response.json() as CmsHospiceRow[];
    const checkedAt = new Date().toISOString();
    return rows.map((row) => {
      const ownershipCode = text(row, "PROPRIETARY_NONPROFIT");
      return {
        npi: text(row, "NPI"),
        ccn: text(row, "CCN"),
        organizationName: text(row, "ORGANIZATION NAME"),
        doingBusinessAs: text(row, "DOING BUSINESS AS NAME"),
        city: text(row, "CITY"),
        state: text(row, "STATE"),
        zipCode: text(row, "ZIP CODE"),
        ownership: ownershipCode === "P" ? "For profit" : ownershipCode === "N" ? "Nonprofit" : "Unknown",
        organizationStructure: text(row, "ORGANIZATION TYPE STRUCTURE"),
        source: { label: "CMS Hospice enrollment data", url: DATASET_PAGE, checkedAt },
      };
    });
  } finally {
    clearTimeout(timeout);
  }
}
