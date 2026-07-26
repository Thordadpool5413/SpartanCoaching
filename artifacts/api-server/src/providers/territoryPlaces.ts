import { SpartanAiToolError } from "@workspace/spartan-ai-tools/server";

type TerritoryInput = {
  zipCodes?: unknown;
  radiusMiles?: unknown;
  facilityTypes?: unknown;
  facilities?: unknown;
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  location?: { latitude?: number; longitude?: number };
};

const MAX_SEARCHES = 20;

export async function hydrateTerritoryFacilities(input: unknown): Promise<unknown> {
  if (!input || typeof input !== "object") return input;
  const candidate = input as TerritoryInput;
  if (Array.isArray(candidate.facilities) && candidate.facilities.length > 0) {
    return input;
  }
  const zipCodes = Array.isArray(candidate.zipCodes)
    ? candidate.zipCodes.map(String).slice(0, 10)
    : [];
  const facilityTypes = Array.isArray(candidate.facilityTypes)
    ? candidate.facilityTypes.map(String).slice(0, 10)
    : [];
  if (!zipCodes.length || !facilityTypes.length) return input;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new SpartanAiToolError(
      "PLACES_PROVIDER_NOT_CONFIGURED",
      503,
      "Territory discovery is unavailable until the Places provider is configured.",
    );
  }

  const searches = zipCodes
    .flatMap((zipCode) => facilityTypes.map((facilityType) => ({ zipCode, facilityType })))
    .slice(0, MAX_SEARCHES);
  const responses = await Promise.all(
    searches.map(async ({ zipCode, facilityType }) => {
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.location",
        },
        body: JSON.stringify({
          textQuery: `${facilityType} near ${zipCode}`,
          maxResultCount: 20,
        }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        throw new SpartanAiToolError(
          "PLACES_PROVIDER_FAILED",
          response.status === 429 ? 429 : 502,
          "The Places provider could not complete the facility search.",
          true,
        );
      }
      const payload = (await response.json()) as { places?: GooglePlace[] };
      return (payload.places ?? []).map((place) => ({
        id: place.id,
        placeId: place.id,
        name: place.displayName?.text ?? "Unnamed facility",
        facilityType,
        zipCode,
        address: place.formattedAddress,
        phone: place.nationalPhoneNumber,
        website: place.websiteUri,
        latitude: place.location?.latitude,
        longitude: place.location?.longitude,
        provider: "google-places",
      }));
    }),
  );

  return {
    ...(input as Record<string, unknown>),
    facilities: responses.flat(),
  };
}
