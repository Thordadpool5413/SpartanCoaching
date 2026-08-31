import { describe, expect, it } from "vitest";
import { trustedReturnUrl } from "./returnUrl";

const SITE = "https://spartanhospicecoaching.com";

describe("trustedReturnUrl", () => {
  it("keeps an absolute return URL on the configured origin", () => {
    expect(
      trustedReturnUrl(SITE, "https://spartanhospicecoaching.com/account?billing=portal", "/account"),
    ).toBe("https://spartanhospicecoaching.com/account?billing=portal");
  });

  it("rejects a prefix-matching attacker origin", () => {
    expect(
      trustedReturnUrl(SITE, "https://spartanhospicecoaching.com.evil.example/steal", "/account"),
    ).toBe("https://spartanhospicecoaching.com/account");
  });

  it("rejects a URL with trusted text in its path or credentials", () => {
    expect(
      trustedReturnUrl(SITE, "https://evil.example/https://spartanhospicecoaching.com", "/account"),
    ).toBe("https://spartanhospicecoaching.com/account");
    expect(
      trustedReturnUrl(SITE, "https://spartanhospicecoaching.com@evil.example/steal", "/account"),
    ).toBe("https://spartanhospicecoaching.com/account");
  });

  it("uses the safe fallback for relative or malformed input", () => {
    expect(trustedReturnUrl(SITE, "/portal", "/account?billing=canceled")).toBe(
      "https://spartanhospicecoaching.com/account?billing=canceled",
    );
    expect(trustedReturnUrl(SITE, "not a URL", "/account")).toBe(
      "https://spartanhospicecoaching.com/account",
    );
  });
});