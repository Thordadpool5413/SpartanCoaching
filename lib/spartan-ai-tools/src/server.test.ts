import { afterEach, describe, expect, it, vi } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";
import {
  isToolFeatureEnabled,
  runSpartanAiTool,
  SpartanAiToolError,
} from "./server";
import { getSpartanAiTool, SPARTAN_AI_TOOLS } from "./registry";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Spartan AI tool runner boundaries", () => {
  it("enables nonclinical tools by default while preserving the kill switch", () => {
    const tool = getSpartanAiTool("email-optimizer")!;
    expect(isToolFeatureEnabled(tool, {})).toBe(true);
    expect(isToolFeatureEnabled(tool, { [tool.featureFlag]: "false" })).toBe(
      false,
    );
    expect(isToolFeatureEnabled(tool, { [tool.featureFlag]: "true" })).toBe(
      true,
    );
  });

  it("enables de-identified clinical tools by default while preserving the kill switch", () => {
    const tool = getSpartanAiTool("medicare-lcd-advisor")!;
    expect(isToolFeatureEnabled(tool, {})).toBe(true);
    expect(isToolFeatureEnabled(tool, { [tool.featureFlag]: "false" })).toBe(
      false,
    );
    expect(isToolFeatureEnabled(tool, { [tool.featureFlag]: "true" })).toBe(
      true,
    );
  });

  it.each(SPARTAN_AI_TOOLS.filter((tool) => !tool.deterministic))(
    "emits an OpenAI-compatible strict output schema for $id",
    (tool) => {
      const format = zodTextFormat(
        tool.outputSchema,
        tool.id.replaceAll("-", "_"),
      );
      const serialized = JSON.stringify(format);
      expect(serialized).not.toContain('"propertyNames"');
      expect(serialized).not.toContain('"format":"uri"');
    },
  );

  it("runs territory discovery deterministically without an AI provider", async () => {
    vi.stubEnv("AI_TOOL_TERRITORY_DISCOVERY", "true");
    const result = await runSpartanAiTool("territory-account-discovery", {
      zipCodes: ["33602"],
      radiusMiles: 10,
      facilityTypes: ["hospital"],
      facilities: [
        { id: "1", name: "A", facilityType: "hospital" },
        { id: "2", name: "B", facilityType: "pharmacy" },
      ],
    });
    expect(result.metadata.model).toBe("deterministic-v1");
    expect(result.output).toMatchObject({ summary: { matched: 1 } });
  });

  it("rejects malformed inputs with a safe error", async () => {
    vi.stubEnv("AI_TOOL_EMAIL_OPTIMIZER", "true");
    await expect(
      runSpartanAiTool("email-optimizer", { situation: "<script>" }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT", status: 400 });
  });

  it("blocks PHI tools until all BAA launch gates are active", async () => {
    vi.stubEnv("AI_TOOL_MEDICARE_LCD_ADVISOR", "true");
    vi.stubEnv("CLINICAL_OPERATION_MODE", "phi");
    vi.stubEnv("HIPAA_PHI_ENABLED", "false");
    await expect(
      runSpartanAiTool("medicare-lcd-advisor", {
        diagnosis: "Example",
        question: "Example question",
      }),
    ).rejects.toMatchObject({ code: "PHI_PROCESSING_DISABLED", status: 503 });
  });

  it("enforces full BAA launch gates when PHI mode is active", async () => {
    vi.stubEnv("AI_TOOL_MEDICARE_LCD_ADVISOR", "true");
    vi.stubEnv("CLINICAL_OPERATION_MODE", "phi");
    vi.stubEnv("HIPAA_PHI_ENABLED", "true");
    vi.stubEnv("OPENAI_BAA_CONFIRMED", "true");
    vi.stubEnv("OPENAI_MODIFIED_RETENTION_CONFIRMED", "true");
    vi.stubEnv("GOOGLE_CLOUD_BAA_CONFIRMED", "true");
    // Missing PHI_STORAGE_BAA_CONFIRMED → blocked before provider call
    await expect(
      runSpartanAiTool("medicare-lcd-advisor", {
        diagnosis: "Example",
        question: "Example question",
      }),
    ).rejects.toMatchObject({
      code: "PHI_STORAGE_BAA_REQUIRED",
      status: 503,
    });
  });

  it("auto-selects PHI mode when all BAA gates are true without explicit mode", async () => {
    vi.stubEnv("AI_TOOL_MEDICARE_LCD_ADVISOR", "true");
    vi.stubEnv("HIPAA_PHI_ENABLED", "true");
    vi.stubEnv("OPENAI_BAA_CONFIRMED", "true");
    vi.stubEnv("OPENAI_MODIFIED_RETENTION_CONFIRMED", "true");
    vi.stubEnv("GOOGLE_CLOUD_BAA_CONFIRMED", "true");
    vi.stubEnv("PHI_STORAGE_BAA_CONFIRMED", "true");
    // All BAAs true → PHI mode; still fails without a provider key (proves gates passed)
    await expect(
      runSpartanAiTool("medicare-lcd-advisor", {
        diagnosis: "Example",
        question: "Example question",
      }),
    ).rejects.toMatchObject({
      code: "PROVIDER_NOT_CONFIGURED",
      status: 503,
    });
  });

  it("maps provider rate limits to a retryable safe error", async () => {
    vi.stubEnv("AI_TOOL_EMAIL_OPTIMIZER", "true");
    const client = {
      responses: {
        parse: vi.fn().mockRejectedValue({ status: 429 }),
      },
    };
    await expect(
      runSpartanAiTool(
        "email-optimizer",
        {
          prospectType: "Hospital",
          situation: "Follow-up after meeting",
          objective: "Schedule education",
          tone: "warm",
          includeSequence: false,
        },
        { client: client as never },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<SpartanAiToolError>>({
        code: "PROVIDER_RATE_LIMITED",
        status: 429,
        retryable: true,
      }),
    );
  });

  it("maps OpenAI connection timeouts to a retryable timeout", async () => {
    vi.stubEnv("AI_TOOL_EMAIL_OPTIMIZER", "true");
    const timeout = Object.assign(new Error("request timed out"), {
      name: "APIConnectionTimeoutError",
    });
    const client = {
      responses: {
        parse: vi.fn().mockRejectedValue(timeout),
      },
    };
    await expect(
      runSpartanAiTool(
        "email-optimizer",
        {
          prospectType: "Hospital",
          situation: "Follow-up after meeting",
          objective: "Schedule education",
          tone: "warm",
          includeSequence: false,
        },
        { client: client as never },
      ),
    ).rejects.toMatchObject({
      code: "PROVIDER_TIMEOUT",
      status: 504,
      retryable: true,
    });
  });

  it("maps provider timeouts and cancellation to safe errors", async () => {
    vi.stubEnv("AI_TOOL_EMAIL_OPTIMIZER", "true");
    const input = {
      prospectType: "Hospital",
      situation: "Follow-up after meeting",
      objective: "Schedule education",
      tone: "warm",
      includeSequence: false,
    };
    const timeoutClient = {
      responses: {
        parse: vi
          .fn()
          .mockRejectedValue(new DOMException("timed out", "TimeoutError")),
      },
    };
    await expect(
      runSpartanAiTool("email-optimizer", input, {
        client: timeoutClient as never,
      }),
    ).rejects.toMatchObject({
      code: "PROVIDER_TIMEOUT",
      status: 504,
      retryable: true,
    });

    const cancelledClient = {
      responses: {
        parse: vi
          .fn()
          .mockRejectedValue(new DOMException("cancelled", "AbortError")),
      },
    };
    await expect(
      runSpartanAiTool("email-optimizer", input, {
        client: cancelledClient as never,
      }),
    ).rejects.toMatchObject({
      code: "PROVIDER_CANCELLED",
      status: 499,
      retryable: false,
    });
  });

  it("rejects oversized and prototype-polluting input before provider use", async () => {
    vi.stubEnv("AI_TOOL_EMAIL_OPTIMIZER", "true");
    await expect(
      runSpartanAiTool("email-optimizer", {
        prospectType: "Hospital",
        situation: "x".repeat(300_000),
        objective: "Schedule education",
        tone: "warm",
        includeSequence: false,
      }),
    ).rejects.toMatchObject({ code: "INPUT_TOO_LARGE", status: 413 });

    const polluted = JSON.parse(
      '{"prospectType":"Hospital","situation":"Follow-up","objective":"Schedule education","tone":"warm","includeSequence":false,"__proto__":{"admin":true}}',
    );
    await expect(
      runSpartanAiTool("email-optimizer", polluted),
    ).rejects.toMatchObject({ code: "UNSAFE_INPUT", status: 400 });
  });
});
