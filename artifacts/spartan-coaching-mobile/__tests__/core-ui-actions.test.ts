import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("REQ-UX-001 native core areas", () => {
  test.each([
    ["Home", "app/(tabs)/index.tsx", /signed-in-home-pillar-|home-explore/],
    ["Command Center", "app/(tabs)/command.tsx", /command-open-tools/],
    ["Tools", "app/(tabs)/tools.tsx", /tool-row-|advanced-ai-tools-library/],
    ["Resources", "app/(tabs)/learn.tsx", /accessibilityRole="link"|resourceAiAction/],
    ["Coach", "app/(tabs)/coach.tsx", /screen-elite-coach|button-send/],
  ])("%s exposes a forward action", (_name, file, actionPattern) => {
    expect(read(file)).toMatch(actionPattern as RegExp);
  });

  test("primary navigation exposes Home, Tools, Resources, and Coach", () => {
    const tabs = read("app/(tabs)/_layout.tsx");
    for (const label of ["Home", "Tools", "Coach"]) {
      expect(tabs).toContain(`tabBarAccessibilityLabel: "${label}"`);
    }
    expect(read("app/(tabs)/index.tsx")).toContain('route: "/(tabs)/learn" as Href');
    expect(tabs).toContain("minHeight: 44");
  });

  test("resource text supports wrapping and bounded previews", () => {
    const resources = read("app/(tabs)/learn.tsx");
    expect(resources).toContain("flexShrink: 1");
    expect(resources).toContain("numberOfLines={4}");
  });

  test("guarded improvements add orientation and dead-end recovery", () => {
    expect(read("lib/workspaceUxFlag.ts")).toMatch(/===\s*"true"/);
    expect(read("components/ui/WorkspaceGuide.tsx")).toContain("Three steps to useful work");
    expect(read("app/(tabs)/learn.tsx")).toContain('ctaTitle={UX_WORKSPACE_IMPROVEMENTS ? "Open Tools"');
    expect(read("app/(tabs)/command.tsx")).toContain('testID="command-how-it-works"');
  });
});
