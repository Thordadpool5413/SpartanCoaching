import { apiGet, apiPut } from "@/lib/api";

export type JurisdictionContext = {
  state: string | null;
  macRegion: string | null;
};

export async function fetchJurisdictionContext(): Promise<JurisdictionContext> {
  const response = await apiGet<{ jurisdiction: JurisdictionContext }>("/api/me/jurisdiction");
  return response.jurisdiction;
}

export async function saveJurisdictionContext(input: JurisdictionContext): Promise<JurisdictionContext> {
  const response = await apiPut<{ jurisdiction: JurisdictionContext }>("/api/me/jurisdiction", input);
  return response.jurisdiction;
}
