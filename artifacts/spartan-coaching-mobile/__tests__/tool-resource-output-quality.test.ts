import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("tool and resource output quality", () => {
  it("normalizes every native quick tool response", () => {
    for (const file of [
      "ObjectionTool.tsx",
      "PlaybookTool.tsx",
      "EmailTool.tsx",
      "ColdCallTool.tsx",
      "WeeklyTool.tsx",
      "ResearchTool.tsx",
    ]) {
      expect(read(`components/tools/${file}`)).toContain("requireGeneratedText");
    }
  });

  it("connects every native library item to Spartan AI", () => {
    const source = read("app/library-item.tsx");
    expect(source).toContain('testID="library-apply-with-ai"');
    expect(source).toContain('targetToolId: "content-generator"');
    expect(source).toContain('router.push("/ai-tools/content-generator")');
  });

  it("keeps professional breathing room in both native result systems", () => {
    expect(read("components/FieldResultPanel.tsx")).toContain(
      "paddingHorizontal: 22, paddingVertical: 26, gap: 20",
    );
    expect(read("components/PremiumAiResult.tsx")).toContain(
      "resultStack: { gap: 20 }",
    );
  });
});
