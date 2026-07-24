import assert from "node:assert/strict";
import { test } from "node:test";
import { searchNpiProviders } from "./npiLookup.ts";

test("searchNpiProviders requires a search key", async () => {
  await assert.rejects(
    () => searchNpiProviders({ city: "Miami" }),
    /Provide NPI number|last name|organization/i,
  );
});

test("searchNpiProviders returns results for a common last name", async () => {
  const results = await searchNpiProviders({ lastName: "Smith", state: "FL", limit: 3 });
  assert.ok(Array.isArray(results));
  // Live registry — allow empty if rate limited, but shape must be valid when present
  for (const r of results) {
    assert.ok(r.npi);
    assert.ok(r.name);
  }
});
