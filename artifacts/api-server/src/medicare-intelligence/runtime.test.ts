import { describe, expect, it } from "vitest";
import { router } from "./runtime";

describe("Medicare Intelligence runtime router", () => {
  it("returns a JSON error when a handler throws", async () => {
    const handler = router({
      "GET /api/failing-tool": [async () => {
        throw new Error("CMS source unavailable");
      }],
    });

    await expect(handler({ method: "GET", path: "/api/failing-tool", query: {}, body: null })).resolves.toEqual({
      statusCode: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "CMS source unavailable" }),
    });
  });
});import { describe, expect, it } from "vitest";
import { currentCancellationSignal } from "./cancellation";
import { json, requireAuth, router } from "./runtime";

describe("Medicare intelligence runtime bridge", () => {
  const handler = router({
    "GET /api/provider/:ccn": [async ({ params, query }) => json({ ccn: params.ccn, state: query.state })],
    "POST /api/private": [requireAuth(), async ({ user }) => json({ userId: user!.userId })],
  });

  it("maps path parameters and query values", async () => {
    const response = await handler({ method: "GET", path: "/api/provider/123456", query: { state: "OK" }, body: null });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body || "{}")).toEqual({ ccn: "123456", state: "OK" });
  });

  it("blocks private operations without tenant identity", async () => {
    const response = await handler({ method: "POST", path: "/api/private", query: {}, body: {} });
    expect(response.statusCode).toBe(401);
  });

  it("passes the tenant-scoped identity into private operations", async () => {
    const response = await handler({ method: "POST", path: "/api/private", query: {}, body: {}, user: { userId: "12:44" } });
    expect(JSON.parse(response.body || "{}").userId).toBe("12:44");
  });

  it("makes the request cancellation signal available to every route", async () => {
    const cancellationAware = router({
      "GET /api/cancellation-aware": [async () => json({ inherited: currentCancellationSignal() !== undefined })],
    });
    const controller = new AbortController();
    const response = await cancellationAware({
      method: "GET",
      path: "/api/cancellation-aware",
      query: {},
      body: null,
      signal: controller.signal,
    });

    expect(JSON.parse(response.body || "{}")).toEqual({ inherited: true });
  });
});
