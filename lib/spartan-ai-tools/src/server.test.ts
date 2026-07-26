import { afterEach, describe, expect, it, vi } from "vitest";
import { runSpartanAiTool, SpartanAiToolError } from "./server";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Spartan AI tool runner boundaries", () => {
  it("runs territory discovery deterministically without an AI provider", async () => {
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
    await expect(
      runSpartanAiTool("email-optimizer", { situation: "<script>" }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT", status: 400 });
  });

  it("blocks PHI tools until all BAA launch gates are active", async () => {
    vi.stubEnv("HIPAA_PHI_ENABLED", "false");
    await expect(
      runSpartanAiTool("medicare-lcd-advisor", {
        diagnosis: "Example",
        question: "Example question",
      }),
    ).rejects.toMatchObject({ code: "PHI_PROCESSING_DISABLED", status: 503 });
  });

  it("maps provider rate limits to a retryable safe error", async () => {
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
});
