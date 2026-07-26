import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isToolFeatureEnabled,
  runSpartanAiTool,
  SpartanAiToolError,
} from "./server";
import { getSpartanAiTool } from "./registry";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Spartan AI tool runner boundaries", () => {
  it("keeps every tool disabled unless its release flag is explicitly true", () => {
    const tool = getSpartanAiTool("email-optimizer")!;
    expect(isToolFeatureEnabled(tool, {})).toBe(false);
    expect(isToolFeatureEnabled(tool, { [tool.featureFlag]: "false" })).toBe(
      false,
    );
    expect(isToolFeatureEnabled(tool, { [tool.featureFlag]: "true" })).toBe(
      true,
    );
  });

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
    vi.stubEnv("HIPAA_PHI_ENABLED", "false");
    await expect(
      runSpartanAiTool("medicare-lcd-advisor", {
        diagnosis: "Example",
        question: "Example question",
      }),
    ).rejects.toMatchObject({ code: "PHI_PROCESSING_DISABLED", status: 503 });
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
