import { test, expect } from "vitest";
import { searchNpiProviders } from "./npiLookup.ts";

test("searchNpiProviders requires a search key", async () => {
  await expect(() => searchNpiProviders({ city: "Miami" })).rejects.toThrow(
    /Provide NPI number|last name|organization/i,
  );
});

test("searchNpiProviders returns results for a common last name", async () => {
  const results = await searchNpiProviders({ lastName: "Smith", state: "FL", limit: 3 });
  expect(Array.isArray(results)).toBe(true);
  for (const r of results) {
    expect(r.npi).toBeTruthy();
    expect(r.name).toBeTruthy();
  }
});
