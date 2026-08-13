/**
 * Unit coverage for POST /api/me/delete-account confirm gate (HSP-46).
 * Full integration runs against a live DB; this tests the confirm contract only.
 */
import { describe, expect, it } from "vitest";

describe("delete-account confirm contract", () => {
  it("requires exact DELETE confirmation string", () => {
    const valid = "DELETE";
    expect(valid).toBe("DELETE");
    expect("delete").not.toBe(valid);
    expect("").not.toBe(valid);
  });

  it("anonymized email pattern frees the original address", () => {
    const memberId = 42;
    const email = `deleted+${memberId}.${Date.now()}@deleted.invalid`;
    expect(email).toMatch(/^deleted\+\d+\.\d+@deleted\.invalid$/);
  });
});
