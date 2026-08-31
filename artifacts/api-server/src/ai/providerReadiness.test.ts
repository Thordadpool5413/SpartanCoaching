import { describe, expect, it } from "vitest";
import { aiConfigurationStatus, classifyAiProviderError } from "./providerReadiness";

describe("AI provider readiness", () => {
  it("rejects CI placeholders instead of claiming AI is ready", () => {
    expect(aiConfigurationStatus({ OPENAI_API_KEY: "ci-placeholder" }).configured).toBe(false);
  });

  it("classifies provider failures for operations without exposing credentials", () => {
    expect(classifyAiProviderError(Object.assign(new Error("invalid api key"), { status: 401, code: "invalid_api_key" }))).toBe("authentication");
    expect(classifyAiProviderError(Object.assign(new Error("insufficient quota"), { status: 429, code: "insufficient_quota" }))).toBe("quota");
    expect(classifyAiProviderError(Object.assign(new Error("requests per minute"), { status: 429, code: "rate_limit_exceeded" }))).toBe("rate_limit");
    expect(classifyAiProviderError(Object.assign(new Error("model not found"), { status: 404, code: "model_not_found" }))).toBe("access");
  });
});
