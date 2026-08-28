import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

describe("native AI runtime reliability", () => {
  it("gives every long-running native AI workflow a provider-sized timeout", () => {
    const api = read("lib/api.ts");
    expect(api).toContain("export const AI_REQUEST_TIMEOUT_MS = 90_000");
    expect(api).toContain("timeoutMs: options?.timeoutMs");

    for (const file of [
      "lib/coachApi.ts",
      "components/ai-tool-screen.tsx",
      "components/RolePlayTool.tsx",
      "app/spartan-intelligence.tsx",
      "app/sales-workflow.tsx",
      "components/tools/ColdCallTool.tsx",
      "components/tools/EmailTool.tsx",
      "components/tools/ObjectionTool.tsx",
      "components/tools/PlaybookTool.tsx",
      "components/tools/ResearchTool.tsx",
      "components/tools/WeeklyTool.tsx",
    ]) {
      expect(read(file)).toContain("AI_REQUEST_TIMEOUT_MS");
    }
  });

  it("times out transcription without losing the recording or hanging forever", () => {
    const api = read("lib/api.ts");
    expect(api).toContain("signal: controller.signal");
    expect(api).toContain("Transcription took too long. Your recording remains on this device");
    expect(api).toContain("clearTimeout(timeout)");
  });
});
