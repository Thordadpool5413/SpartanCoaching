import { describe, expect, it } from "vitest";
import {
  RELIABILITY_TARGETS,
  evaluateAgainstTarget,
  getTarget,
  isAiPath,
} from "./reliabilityTargets";

describe("reliability targets", () => {
  it("defines web, ios, and api surfaces", () => {
    const surfaces = new Set(RELIABILITY_TARGETS.map((t) => t.surface));
    expect(surfaces.has("api")).toBe(true);
    expect(surfaces.has("web")).toBe(true);
    expect(surfaces.has("ios")).toBe(true);
  });

  it("every target has owner and alert above target (or equal for ratio floors)", () => {
    for (const t of RELIABILITY_TARGETS) {
      expect(t.owner).toBeTruthy();
      expect(t.alert).toBeGreaterThanOrEqual(t.target);
      expect(t.id).toMatch(/^(api|web|ios)\./);
    }
  });

  it("classifies AI paths", () => {
    expect(isAiPath("/api/ai/tools/run")).toBe(true);
    expect(isAiPath("/api/healthz")).toBe(false);
  });

  it("evaluates alert bands", () => {
    const ok = evaluateAgainstTarget("api.request_p95", 100);
    expect(ok?.status).toBe("ok");
    const watch = evaluateAgainstTarget("api.request_p95", 1000);
    expect(watch?.status).toBe("watch");
    const alert = evaluateAgainstTarget("api.request_p95", 5000);
    expect(alert?.status).toBe("alert");
  });

  it("getTarget returns known ids", () => {
    expect(getTarget("web.lcp")?.metric).toBe("largest_contentful_paint_ms");
    expect(getTarget("missing")).toBeUndefined();
  });
});
