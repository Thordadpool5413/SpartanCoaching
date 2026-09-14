import { afterEach, describe, expect, it, vi } from "vitest";
import { loadMemberWork, MemberWorkApiError } from "./memberWorkClient";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("member work client errors", () => {
  it("preserves the structured code and message from a saved-work failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "POTENTIAL_PHI_DETECTED",
              message: "Remove patient identifiers before saving work.",
            },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const failure = loadMemberWork();

    await expect(failure).rejects.toBeInstanceOf(MemberWorkApiError);
    await expect(failure).rejects.toMatchObject({
      status: 400,
      code: "POTENTIAL_PHI_DETECTED",
      message: "Remove patient identifiers before saving work.",
    });
  });
});