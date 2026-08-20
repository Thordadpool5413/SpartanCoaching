/**
 * Current Medicare Home Health and Hospice MAC state assignments.
 *
 * Source: CMS, "Who are the MACs" and "MACs by State", last verified
 * 2026-08-18. Keep this mapping reviewed as part of every clinical release.
 * https://www.cms.gov/medicare/coding-billing/medicare-administrative-contractors-macs/who-are-macs
 */

export type HhhMacCode = "J6" | "J15" | "JK" | "JM";

export type HhhMacJurisdiction = {
  code: HhhMacCode;
  contractor: string;
  label: string;
};

export const HHH_MAC_JURISDICTIONS: Record<HhhMacCode, HhhMacJurisdiction> = {
  J6: {
    code: "J6",
    contractor: "National Government Services",
    label: "Jurisdiction 6 · National Government Services",
  },
  J15: {
    code: "J15",
    contractor: "CGS Administrators",
    label: "Jurisdiction 15 · CGS Administrators",
  },
  JK: {
    code: "JK",
    contractor: "National Government Services",
    label: "Jurisdiction K · National Government Services",
  },
  JM: {
    code: "JM",
    contractor: "Palmetto GBA",
    label: "Jurisdiction M · Palmetto GBA",
  },
};

const STATE_GROUPS: Record<HhhMacCode, readonly string[]> = {
  J6: [
    "Alaska", "Arizona", "California", "Hawaii", "Idaho", "Michigan",
    "Minnesota", "Nevada", "New Jersey", "New York", "Oregon",
    "Washington", "Wisconsin",
  ],
  J15: [
    "Colorado", "Delaware", "District of Columbia", "Iowa", "Kansas",
    "Maryland", "Missouri", "Montana", "Nebraska", "North Dakota",
    "Pennsylvania", "South Dakota", "Utah", "Virginia", "West Virginia",
    "Wyoming",
  ],
  JK: [
    "Connecticut", "Maine", "Massachusetts", "New Hampshire",
    "Rhode Island", "Vermont",
  ],
  JM: [
    "Alabama", "Arkansas", "Florida", "Georgia", "Illinois", "Indiana",
    "Kentucky", "Louisiana", "Mississippi", "New Mexico", "North Carolina",
    "Ohio", "Oklahoma", "South Carolina", "Tennessee", "Texas",
  ],
};

export const HHH_MAC_STATES = Object.entries(STATE_GROUPS)
  .flatMap(([code, states]) => states.map((state) => ({
    state,
    jurisdiction: HHH_MAC_JURISDICTIONS[code as HhhMacCode],
  })))
  .sort((a, b) => a.state.localeCompare(b.state));

export function getHhhMacForState(state: string | null | undefined): HhhMacJurisdiction | null {
  const normalized = state?.trim().toLocaleLowerCase("en-US");
  if (!normalized) return null;
  return HHH_MAC_STATES.find((item) => item.state.toLocaleLowerCase("en-US") === normalized)?.jurisdiction ?? null;
}

export function isValidHhhMacSelection(
  state: string | null | undefined,
  macRegion: string | null | undefined,
): boolean {
  const expected = getHhhMacForState(state);
  if (!expected || !macRegion) return false;
  const value = macRegion.trim().toLocaleLowerCase("en-US");
  return [expected.code, expected.label, expected.contractor]
    .some((candidate) => candidate.toLocaleLowerCase("en-US") === value);
}

