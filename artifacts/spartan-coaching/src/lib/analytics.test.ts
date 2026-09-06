import { afterEach, describe, expect, it, vi } from "vitest";
import { trackProjectEvent } from "./analytics";

afterEach(() => {
  vi.restoreAllMocks();
  delete window.umami;
});

describe("Replit project analytics bridge", () => {
  it("forwards safe event dimensions without free-form event names", () => {
    const track = vi.fn();
    window.umami = { track };

    trackProjectEvent(
      "public_funnel",
      "cta_click",
      JSON.stringify({ source: "home_hero", campaign: "fall_launch" }),
    );

    expect(track).toHaveBeenCalledWith("public_funnel", {
      action: "cta_click",
      source: "home_hero",
      campaign: "fall_launch",
    });
  });

  it("keeps resource titles out of hosted analytics", () => {
    const track = vi.fn();
    window.umami = { track };

    trackProjectEvent(
      "resource_download",
      "A free-form resource title with visitor content",
      JSON.stringify({ resourceId: "resource_42" }),
    );

    expect(track).toHaveBeenCalledWith("resource_download", {
      resourceId: "resource_42",
    });
  });

  it("does not throw when the injected tracker is absent or fails", () => {
    expect(() => trackProjectEvent("public_funnel", "cta_click", null)).not.toThrow();

    window.umami = {
      track: () => {
        throw new Error("tracker unavailable");
      },
    };

    expect(() => trackProjectEvent("public_funnel", "cta_click", null)).not.toThrow();
  });
});