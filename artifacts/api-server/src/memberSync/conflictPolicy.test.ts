import { describe, expect, it } from "vitest";
import { shouldApplyMemberSyncMutation } from "./conflictPolicy";

describe("member sync conflict policy", () => {
  const base = {
    mutationId: "device-a-0001",
    clientUpdatedAt: "2026-08-23T10:00:00.000Z",
  };

  it("accepts a newer offline edit", () => {
    expect(shouldApplyMemberSyncMutation(base, {
      mutationId: "device-b-0001",
      clientUpdatedAt: "2026-08-23T10:01:00.000Z",
    })).toBe(true);
  });

  it("keeps the newer server record when an old retry arrives", () => {
    expect(shouldApplyMemberSyncMutation(base, {
      mutationId: "device-b-0001",
      clientUpdatedAt: "2026-08-23T09:59:00.000Z",
    })).toBe(false);
  });

  it("resolves same-clock writes deterministically", () => {
    expect(shouldApplyMemberSyncMutation(base, {
      mutationId: "device-z-0001",
      clientUpdatedAt: base.clientUpdatedAt,
    })).toBe(true);
    expect(shouldApplyMemberSyncMutation(base, {
      mutationId: "device-0-0001",
      clientUpdatedAt: base.clientUpdatedAt,
    })).toBe(false);
  });
});