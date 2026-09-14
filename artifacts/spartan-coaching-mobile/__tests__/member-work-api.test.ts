import { ApiError, apiGet } from "@/lib/api";

describe("member work API errors", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("preserves the structured code and message from a saved-work failure", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Saved work was not found.",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      ),
    );

    const failure = apiGet("/api/v1/member-work/missing");

    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
      message: "Saved work was not found.",
    });
  });
});