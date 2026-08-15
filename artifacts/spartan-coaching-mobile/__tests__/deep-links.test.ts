import { mapSecureDeepLinkKey, parseDeepLink } from "@/lib/deepLinks";

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
  });

  it("rejects unrelated web hosts and maps the secure Coach key", () => {
    expect(parseDeepLink("https://example.com/coach")).toBeNull();
    expect(mapSecureDeepLinkKey("coach")).toEqual({ pathname: "/(tabs)/coach" });
  });
});
