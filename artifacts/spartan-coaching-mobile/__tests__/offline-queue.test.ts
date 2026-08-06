import { ApiError } from "@/lib/api";
import { shouldEnqueueOnError, userFacingApiError } from "@/lib/offlineQueue";

describe("offline queue error policy", () => {
  it("enqueues on network-like errors (non-ApiError)", () => {
    expect(shouldEnqueueOnError(new Error("Failed to fetch"))).toBe(true);
    expect(shouldEnqueueOnError("boom")).toBe(true);
  });

  it("enqueues on 5xx ApiError", () => {
    expect(shouldEnqueueOnError(new ApiError("server", 500))).toBe(true);
    expect(shouldEnqueueOnError(new ApiError("bad gateway", 502))).toBe(true);
  });

  it("does not enqueue on 401/403/4xx", () => {
    expect(shouldEnqueueOnError(new ApiError("auth", 401))).toBe(false);
    expect(shouldEnqueueOnError(new ApiError("denied", 403))).toBe(false);
    expect(shouldEnqueueOnError(new ApiError("bad", 422))).toBe(false);
  });

  it("maps access errors for users", () => {
    expect(userFacingApiError(new ApiError("x", 403))).toMatch(/Hospice Sales Pro/);
    expect(userFacingApiError(new ApiError("Too long", 400))).toBe("Too long");
  });
});
