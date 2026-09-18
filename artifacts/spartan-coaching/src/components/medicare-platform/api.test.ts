import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("Medicare Intelligence API client", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

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

  it("allows evidence-heavy reads more time before returning a recoverable timeout", async () => {
    vi.useFakeTimers();
    const request = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    vi.stubGlobal("fetch", request);

    const pending = api.get("/api/dashboard?state=TX");
    const rejection = expect(pending).rejects.toMatchObject({
      message: expect.stringContaining("timed out"),
      response: {
        status: 408,
        data: expect.objectContaining({ code: "MEDICARE_TIMEOUT" }),
      },
    });
    await vi.advanceTimersByTimeAsync(89_999);
    expect(request.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    expect(request).toHaveBeenCalledWith(
      "/api/v1/medicare/dashboard?state=TX",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
