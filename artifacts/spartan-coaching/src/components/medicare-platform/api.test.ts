import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("Medicare Intelligence API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("routes imported platform calls through the authenticated Spartan bridge", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ state: "OK" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", request);

    await expect(api.get("/api/dashboard?state=OK")).resolves.toEqual({ data: { state: "OK" } });
    expect(request).toHaveBeenCalledWith("/api/v1/medicare/dashboard?state=OK", expect.objectContaining({ credentials: "include" }));
  });

  it("preserves the runtime error body and status for trustworthy recovery messaging", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "CMS source unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })));

    await expect(api.get("/api/provider/371653")).rejects.toMatchObject({
      message: "CMS source unavailable",
      response: { status: 503, data: { error: "CMS source unavailable" } },
    });
  });
});
