import { describe, expect, it } from "vitest";
import { isUsableOpenAiApiKey } from "./provider-config";

describe("isUsableOpenAiApiKey", () => {
  it("rejects empty and whitespace", () => {
    expect(isUsableOpenAiApiKey(undefined)).toBe(false);
    expect(isUsableOpenAiApiKey(null)).toBe(false);
    expect(isUsableOpenAiApiKey("")).toBe(false);
    expect(isUsableOpenAiApiKey("   ")).toBe(false);
  });

  it("rejects CI and documentation placeholders", () => {
    expect(isUsableOpenAiApiKey("ci-placeholder-no-network-calls")).toBe(
      false,
    );
    expect(isUsableOpenAiApiKey("your-api-key-here")).toBe(false);
    expect(isUsableOpenAiApiKey("sk-placeholder")).toBe(false);
    expect(isUsableOpenAiApiKey("changeme")).toBe(false);
  });

  it("accepts real-looking configured values", () => {
    expect(isUsableOpenAiApiKey("sk-proj-abc123real")).toBe(true);
    expect(isUsableOpenAiApiKey("configured")).toBe(true);
  });
});
