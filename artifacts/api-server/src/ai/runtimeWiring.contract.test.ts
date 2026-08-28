import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const apiRoot = path.resolve(__dirname, "../..");
const repositoryRoot = path.resolve(apiRoot, "../..");
const read = (filePath: string) => fs.readFileSync(filePath, "utf8");

describe("AI runtime reliability wiring", () => {
  it("starts the live provider probe when the API begins listening", () => {
    const indexSource = read(path.join(apiRoot, "src/index.ts"));
    expect(indexSource).toContain('import { runLiveAiProviderProbe } from "./ai/providerReadiness"');
    expect(indexSource).toContain("void runLiveAiProviderProbe()");
  });

  it("retries empty conversational and structured output instead of saving a fake reply", () => {
    const openAiSource = read(path.join(apiRoot, "src/openai.ts"));
    const toolServerSource = read(path.join(repositoryRoot, "lib/spartan-ai-tools/src/server.ts"));

    expect(openAiSource).toContain("createNonEmptyChatCompletion");
    expect(openAiSource).toContain("attempt <= 2");
    expect(openAiSource).not.toContain('return "I need a moment to think about that.');
    expect(toolServerSource).toContain("attempt <= 2");
    expect(toolServerSource).toContain("invalid structured response after retry");
  });
});
