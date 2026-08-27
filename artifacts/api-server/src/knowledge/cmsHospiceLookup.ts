const DATASET_ID = "a6a063c5-3d7c-463c-b914-07b8409ca8fd";
const DATASET_URL = `https://data.cms.gov/data-api/v1/dataset/${DATASET_ID}/data`;
const DATASET_PAGE = "https://data.cms.gov/provider-data/dataset/252m-zfp9";

type CmsHospiceRow = Record<string, unknown>;
const CMS_DATA_PAGE = "https://data.cms.gov/provider-data/topics/hospice-care";
const CMS_ENROLLMENT_PAGE = "https://data.cms.gov/provider-characteristics/hospitals-and-other-facilities/hospice-enrollments";
const CMS_QUERY_ROOT = "https://data.cms.gov/provider-data/api/1/datastore/query";
const CMS_OPEN_DATA_ROOT = "https://data.cms.gov/data-api/v1/dataset";

const DATASETS = {
  general: "yc9t-dgbk",
  providerQuality: "252m-zfp9",
  providerCahps: "gxki-hrr8",
  stateQuality: "eda0-92f0",
  stateCahps: "a55e-5b88",
  serviceArea: "95rg-2usp",
  enrollment: "25704213-e833-4b8b-9dbc-58dd17149209",
} as const;

type CmsRow = Record<string, unknown>;
type Condition = { property: string; value: string | number; operator?: "=" | "contains" };
type CacheEntry = { expiresAt: number; value: unknown };

const cache = new Map<string, CacheEntry>();
const CACHE_MS = 10 * 60 * 1000;

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
  facilityName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  phone: string;
  ownership: string;
  organizationStructure: string;
  certificationDate: string;
  yearsCertified: number | null;
  source: { label: "CMS Care Compare hospice data"; url: string; checkedAt: string };
};

export type MarketSummary = {
  totalMatched: number;
  displayed: number;
  ownership: Array<{ label: string; count: number }>;
  establishedBefore2000: number;
  newestCertificationYear: number | null;
  sourceCheckedAt: string;
};

export type HospiceMeasure = {
  code: string;
  name: string;
  score: number | null;
  displayScore: string;
  stateScore: number | null;
  differenceFromState: number | null;
  direction: "higher" | "lower" | "same" | "not-comparable";
  favorable: boolean | null;
  comparisonLabel: string;
  reportingPeriod: string;
  footnote: string;
};

export type HospiceProfile = {
  organization: HospiceOrganization;
  quality: HospiceMeasure[];
  familyExperience: HospiceMeasure[];
  serviceArea: { zipCodes: string[]; count: number };
  strengths: string[];
  questionsToAsk: string[];
  interpretation: string;
  sources: Array<{ label: string; url: string; checkedAt: string }>;
};

function text(row: CmsRow | undefined, key: string): string {
  const value = row?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function numeric(value: string): number | null {
  if (!value || /not available|not applicable|^\s*-\s*$/i.test(value)) return null;
  const parsed = Number(value.replace(/[$,%]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function yearsSince(value: string): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 31_557_600_000));
}

async function providerQuery(dataset: string, conditions: Condition[], limit = 500): Promise<{ count: number; rows: CmsRow[] }> {
  const key = JSON.stringify({ dataset, conditions, limit });
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as { count: number; rows: CmsRow[] };

  const response = await fetch(`${CMS_QUERY_ROOT}/${dataset}/0`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      conditions: conditions.map((condition) => ({ ...condition, operator: condition.operator || "=" })),
      limit,
      count: true,
      results: true,
      schema: false,
      keys: true,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error("CMS Care Compare data is temporarily unavailable.");
  const json = await response.json() as { count?: number; results?: CmsRow[] };
  const value = { count: Number(json.count || 0), rows: json.results || [] };
  cache.set(key, { expiresAt: Date.now() + CACHE_MS, value });
  return value;
}

async function enrollmentQuery(state: string, city?: string): Promise<CmsRow[]> {
  const key = `enrollment:${state}:${city || ""}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as CmsRow[];
  const url = new URL(`${CMS_OPEN_DATA_ROOT}/${DATASETS.enrollment}/data`);
  url.searchParams.set("filter[STATE]", state);
  if (city) url.searchParams.set("filter[CITY]", city);
  url.searchParams.set("size", "500");
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) return [];
  const value = await response.json() as CmsRow[];
  cache.set(key, { expiresAt: Date.now() + CACHE_MS, value });
  return value;
}

function mapOrganization(row: CmsRow, enrollment?: CmsRow): HospiceOrganization {
  const certificationDate = text(row, "certification_date");
  const line2 = text(row, "address_line_2");
  const facilityName = text(row, "facility_name");
  const checkedAt = new Date().toISOString();
  return {
    npi: text(enrollment, "NPI"),
    ccn: text(row, "cms_certification_number_ccn"),
    organizationName: text(enrollment, "ORGANIZATION NAME") || facilityName,
    doingBusinessAs: text(enrollment, "DOING BUSINESS AS NAME") || facilityName,
    facilityName,
    address: [text(row, "address_line_1"), line2 === "-" ? "" : line2].filter(Boolean).join(", "),
    city: text(row, "citytown"),
    state: text(row, "state"),
    zipCode: text(row, "zip_code"),
    county: text(row, "countyparish"),
    phone: text(row, "telephone_number"),
    ownership: text(row, "ownership_type") || "Unknown",
    organizationStructure: text(enrollment, "ORGANIZATION TYPE STRUCTURE"),
    certificationDate,
    yearsCertified: yearsSince(certificationDate),
    source: { label: "CMS Care Compare hospice data", url: CMS_DATA_PAGE, checkedAt },
  };
}

function buildMarketSummary(rows: HospiceOrganization[], totalMatched: number): MarketSummary {
  const ownershipMap = new Map<string, number>();
  let establishedBefore2000 = 0;
  let newestCertificationYear: number | null = null;
  for (const row of rows) {
    ownershipMap.set(row.ownership, (ownershipMap.get(row.ownership) || 0) + 1);
    const year = Number(row.certificationDate.slice(-4));
    if (Number.isFinite(year)) {
      if (year < 2000) establishedBefore2000 += 1;
      newestCertificationYear = newestCertificationYear === null ? year : Math.max(newestCertificationYear, year);
    }
  }
  return {
    totalMatched,
    displayed: rows.length,
    ownership: [...ownershipMap.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    establishedBefore2000,
    newestCertificationYear,
    sourceCheckedAt: new Date().toISOString(),
  };
}

export async function searchCmsHospices(input: {
  state: string;
  city?: string;
  county?: string;
  zipCode?: string;
  name?: string;
  ownership?: string;
  limit?: number;
}): Promise<{ results: HospiceOrganization[]; summary: MarketSummary }> {
  const state = input.state.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(state)) throw new Error("State must use the two letter abbreviation.");
  const city = input.city?.trim().toUpperCase();
  const conditions: Condition[] = [{ property: "state", value: state }];
  if (city) conditions.push({ property: "citytown", value: city });
  if (input.county?.trim()) conditions.push({ property: "countyparish", value: input.county.trim().toUpperCase() });
  if (input.zipCode?.trim()) conditions.push({ property: "zip_code", value: input.zipCode.trim().slice(0, 5) });
  if (input.name?.trim()) conditions.push({ property: "facility_name", value: input.name.trim().toUpperCase(), operator: "contains" });
  if (input.ownership?.trim()) conditions.push({ property: "ownership_type", value: input.ownership.trim() });

  const requestedLimit = Math.max(1, Math.min(input.limit || 50, 100));
  const [general, enrollments] = await Promise.all([
    providerQuery(DATASETS.general, conditions, Math.max(requestedLimit, 500)),
    enrollmentQuery(state, city),
  ]);
  const enrollmentByCcn = new Map(enrollments.map((row) => [text(row, "CCN"), row]));
  const mapped = general.rows.map((row) => mapOrganization(row, enrollmentByCcn.get(text(row, "cms_certification_number_ccn"))));
  return { results: mapped.slice(0, requestedLimit), summary: buildMarketSummary(mapped, general.count) };
}

const LOWER_IS_BETTER = new Set([
  "H_012_02_OBSERVED",
  "H_012_03_OBSERVED",
  "H_012_04_OBSERVED",
  "H_012_05_OBSERVED",
  "H_012_06_OBSERVED",
  "H_012_07_OBSERVED",
  "H_012_08_OBSERVED",
  "H_012_09_OBSERVED",
  "H_012_10_OBSERVED",
]);

function toMeasure(row: CmsRow, stateByCode: Map<string, CmsRow>, dateKey: string): HospiceMeasure {
  const code = text(row, "measure_code");
  const scoreText = text(row, "score") === "Not Applicable" ? text(row, "star_rating") : text(row, "score");
  const score = numeric(scoreText);
  const stateRow = stateByCode.get(code);
  const stateScoreText = text(stateRow, "score") === "Not Applicable" ? text(stateRow, "star_rating") : text(stateRow, "score");
  const stateScore = numeric(stateScoreText);
  const difference = score !== null && stateScore !== null ? Number((score - stateScore).toFixed(1)) : null;
  const favorable = difference === null || difference === 0 ? null : LOWER_IS_BETTER.has(code) ? difference < 0 : difference > 0;
  const comparisonLabel = difference === null
    ? "State comparison unavailable"
    : difference === 0
      ? "Matches the state result"
      : `${Math.abs(difference)} ${code === "SUMMARY_STAR_RATING" ? "stars" : "points"} ${difference > 0 ? "above" : "below"} the state result`;
  return {
    code,
    name: text(row, "measure_name").replace(/\|/g, ""),
    score,
    displayScore: scoreText || "Not reported",
    stateScore,
    differenceFromState: difference,
    direction: difference === null ? "not-comparable" : difference > 0 ? "higher" : difference < 0 ? "lower" : "same",
    favorable,
    comparisonLabel,
    reportingPeriod: text(row, dateKey),
    footnote: text(row, "footnote"),
  };
}

function usefulQuality(rows: CmsRow[]): CmsRow[] {
  const preferred = new Set([
    "H_008_01_OBSERVED",
    "H_011_01_OBSERVED",
    "H_012_00_OBSERVED",
    "H_012_02_OBSERVED",
    "H_012_08_OBSERVED",
    "H_012_10_OBSERVED",
    "H_012_03_OBSERVED",
    "H_012_05_OBSERVED",
    "H_012_06_OBSERVED",
    "H_012_08_OBSERVED",
    "H_012_09_OBSERVED",
    "H_012_10_OBSERVED",
  ]);
  return rows.filter((row) => preferred.has(text(row, "measure_code")) || preferred.has(text(row, "measure_name")));
}

function usefulCahps(rows: CmsRow[]): CmsRow[] {
  const preferred = new Set(["EMO_REL_TBV", "RATING_TBV", "RECOMMEND_TBV", "RESPECT_TBV", "SYMPTOMS_TBV", "TEAM_COMM_TBV", "TIMELY_CARE_TBV", "SUMMARY_STAR_RATING"]);
  return rows.filter((row) => preferred.has(text(row, "measure_code")));
}

export async function getCmsHospiceProfile(ccnInput: string): Promise<HospiceProfile> {
  const ccn = ccnInput.trim();
  if (!/^\d{6}$/.test(ccn)) throw new Error("Choose a hospice with a valid six digit CCN.");
  const general = await providerQuery(DATASETS.general, [{ property: "cms_certification_number_ccn", value: ccn }], 1);
  if (!general.rows.length) throw new Error("CMS did not return a hospice for that CCN.");
  const state = text(general.rows[0], "state");
  const [quality, cahps, stateQuality, stateCahps, serviceArea, enrollments] = await Promise.all([
    providerQuery(DATASETS.providerQuality, [{ property: "cms_certification_number_ccn", value: ccn }], 100),
    providerQuery(DATASETS.providerCahps, [{ property: "cms_certification_number_ccn", value: ccn }], 100),
    providerQuery(DATASETS.stateQuality, [{ property: "state", value: state }], 100),
    providerQuery(DATASETS.stateCahps, [{ property: "state", value: state }], 100),
    providerQuery(DATASETS.serviceArea, [{ property: "cms_certification_number_ccn", value: ccn }], 500),
    enrollmentQuery(state),
  ]);
  const enrollment = enrollments.find((row) => text(row, "CCN") === ccn);
  const organization = mapOrganization(general.rows[0], enrollment);
  const stateQualityByCode = new Map(stateQuality.rows.map((row) => [text(row, "measure_code"), row]));
  const stateCahpsByCode = new Map(stateCahps.rows.map((row) => [text(row, "measure_code"), row]));
  const qualityMeasures = usefulQuality(quality.rows).map((row) => toMeasure(row, stateQualityByCode, "measure_date_range"));
  const familyMeasures = usefulCahps(cahps.rows).map((row) => toMeasure(row, stateCahpsByCode, "date"));
  const comparable = [...qualityMeasures, ...familyMeasures].filter((measure) => measure.differenceFromState !== null);
  const strengths = comparable
    .filter((measure) => measure.favorable && Math.abs(measure.differenceFromState || 0) >= 2)
    .sort((a, b) => Math.abs(b.differenceFromState || 0) - Math.abs(a.differenceFromState || 0))
    .slice(0, 3)
    .map((measure) => `${measure.name}: ${measure.displayScore}. ${measure.comparisonLabel}.`);
  const opportunities = comparable
    .filter((measure) => measure.favorable === false && Math.abs(measure.differenceFromState || 0) >= 2)
    .sort((a, b) => Math.abs(b.differenceFromState || 0) - Math.abs(a.differenceFromState || 0))
    .slice(0, 3)
    .map((measure) => `How is your team working on ${measure.name.toLowerCase()} today?`);

  return {
    organization,
    quality: qualityMeasures,
    familyExperience: familyMeasures,
    serviceArea: { zipCodes: serviceArea.rows.map((row) => text(row, "zip_code")).filter(Boolean), count: serviceArea.count },
    strengths: strengths.length ? strengths : ["CMS does not currently report a clear above-state signal in the selected measures."],
    questionsToAsk: opportunities.length ? opportunities : ["Which quality or family experience result matters most to your leadership team this year?"],
    interpretation: "CMS results describe reported performance for the stated measurement period. They do not prove service quality today, explain causation, or replace direct discovery.",
    sources: [
      { label: "CMS Care Compare hospice data", url: CMS_DATA_PAGE, checkedAt: organization.source.checkedAt },
      { label: "CMS hospice enrollment data", url: CMS_ENROLLMENT_PAGE, checkedAt: organization.source.checkedAt },
    ],
  };
}
