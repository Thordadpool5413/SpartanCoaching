import { describe, expect, it } from "vitest";
import {
  API_CONTRACT_VERSION,
  MIN_IOS_APP_VERSION,
  PRODUCT_FEATURE_FLAG_KEYS,
  checkIosCompatibility,
  isVersionAtLeast,
  parseSemver,
} from "./client-delivery";

describe("client delivery contract", () => {
  it("parses semver", () => {
    expect(parseSemver("1.0.0")).toEqual([1, 0, 0]);
    expect(parseSemver("2.3.4-beta")).toEqual([2, 3, 4]);
    expect(parseSemver("nope")).toBeNull();
  });

  it("compares versions", () => {
    expect(isVersionAtLeast("1.0.0", "1.0.0")).toBe(true);
    expect(isVersionAtLeast("1.0.1", "1.0.0")).toBe(true);
    expect(isVersionAtLeast("0.9.9", "1.0.0")).toBe(false);
  });

  it("checks iOS compatibility against min", () => {
    expect(checkIosCompatibility(MIN_IOS_APP_VERSION).ok).toBe(true);
    expect(checkIosCompatibility("0.0.1", { minIosAppVersion: "1.0.0" }).ok).toBe(false);
    expect(checkIosCompatibility("0.0.1", { minIosAppVersion: "1.0.0" }).reason).toBe(
      "below_min_ios",
    );
  });

  it("flags outdated API contract claim", () => {
    const r = checkIosCompatibility("1.0.0", {
      apiContractVersion: 2,
      clientApiContract: 1,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("api_contract_too_old");
  });

  it("exports contract version and flag keys", () => {
    expect(API_CONTRACT_VERSION).toBeGreaterThanOrEqual(1);
    expect(PRODUCT_FEATURE_FLAG_KEYS.length).toBeGreaterThan(3);
  });
});
