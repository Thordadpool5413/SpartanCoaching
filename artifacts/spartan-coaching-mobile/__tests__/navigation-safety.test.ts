import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (name: string) => fs.readFileSync(path.join(root, name), "utf8");

describe("native navigation safety", () => {
  it("gives custom back controls a logical parent after reloads and deep links", () => {
    const navigation = read("lib/navigation.ts");
    const toolShell = read("components/tools/ToolShell.tsx");
    const tour = read("app/tour.tsx");
    const advanced = read("app/ai-tools/index.tsx");
    const aiTool = read("components/ai-tool-screen.tsx");
    const resource = read("app/resource-work.tsx");

    expect(navigation).toContain("router.canGoBack()");
    expect(navigation).toContain("router.replace(fallback)");
    expect(toolShell).toContain('goBackOrReplace("/(tabs)/tools")');
    expect(tour).toContain('goBackOrReplace("/(tabs)")');
    expect(advanced).toContain('goBackOrReplace("/(tabs)/tools")');
    expect(aiTool).toContain('goBackOrReplace("/ai-tools")');
    expect(resource).toContain('goBackOrReplace("/(tabs)/tools?view=library")');
  });
});
