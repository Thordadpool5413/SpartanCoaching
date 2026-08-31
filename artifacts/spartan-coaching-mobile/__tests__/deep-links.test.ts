import {
  mapSecureDeepLinkKey,
  parseDeepLink,
  parseLoginReturnTarget,
  requiresAuthenticationForTarget,
  serializeLoginReturnTarget,
} from "@/lib/deepLinks";

describe("deep links", () => {
  it("opens Coach from the custom scheme", () => {
    expect(parseDeepLink("spartan-coaching-mobile://coach")).toEqual({ pathname: "/(tabs)/coach" });
  });

  it("uses the path for production universal links", () => {
    expect(parseDeepLink("https://spartanhospicecoaching.com/tool/objection")).toEqual({
      pathname: "/tool/[tab]",
      params: { tab: "objection" },
    });
    expect(parseDeepLink("https://www.spartanhospicecoaching.com/coach")).toEqual({ pathname: "/(tabs)/coach" });
    expect(parseDeepLink("https://spartanhospicecoaching.com/app?open=command")).toEqual({
      pathname: "/sales-workflow",
    });
    expect(parseDeepLink("https://spartanhospicecoaching.com/app?open=my-work")).toEqual({
      pathname: "/(tabs)/my-work",
    });
  });

  it("rejects unrelated web hosts and maps the secure Coach key", () => {
    expect(parseDeepLink("https://example.com/coach")).toBeNull();
    expect(mapSecureDeepLinkKey("coach")).toEqual({ pathname: "/(tabs)/coach" });
  });

  it("preserves only validated internal targets through native sign-in", () => {
    const serialized = serializeLoginReturnTarget({
      pathname: "/tool/[tab]",
      params: { tab: "objection" },
    });
    expect(parseLoginReturnTarget(serialized)).toEqual({
      pathname: "/tool/[tab]",
      params: { tab: "objection" },
    });
    expect(parseLoginReturnTarget('{"pathname":"https://example.com"}')).toBeNull();
    expect(parseLoginReturnTarget('{"pathname":"/tool/[tab]","params":{"tab":"invalid"}}')).toBeNull();
    expect(requiresAuthenticationForTarget({ pathname: "/(tabs)/account" })).toBe(true);
    expect(requiresAuthenticationForTarget({ pathname: "/(tabs)" })).toBe(false);
  });
});
