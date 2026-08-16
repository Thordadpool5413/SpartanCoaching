import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "..");
const read = (relativePath: string) =>
  fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("native interface resilience", () => {
  it("provides an accessible password reveal control", () => {
    const input = read("components/ui/SpartanInput.tsx");

    expect(input).toContain('accessibilityLabel={revealed ? "Hide password" : "Show password"}');
    expect(input).toContain("secureTextEntry={isPassword && !revealed}");
    expect(input).toContain("width: MIN_TOUCH_TARGET");
    expect(input).toContain("minHeight: MIN_TOUCH_TARGET");
  });

  it("keeps crash recovery controls accessible and theme safe", () => {
    const fallback = read("components/ErrorFallback.tsx");

    expect(fallback).toContain('accessibilityLabel="Reload Spartan Coaching"');
    expect(fallback).toContain('accessibilityLabel="Open error details"');
    expect(fallback).toContain('accessibilityLabel="Close error details"');
    expect(fallback).toContain("borderBottomColor: colors.border");
    expect(fallback).not.toMatch(/#[0-9a-f]{7}(?![0-9a-f])/i);
  });
});
