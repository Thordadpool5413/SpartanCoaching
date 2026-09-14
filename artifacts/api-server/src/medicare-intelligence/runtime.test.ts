import { describe, expect, it } from "vitest";
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
});
