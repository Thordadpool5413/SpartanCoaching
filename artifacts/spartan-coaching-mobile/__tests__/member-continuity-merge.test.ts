import { mergeTimestampedRecords } from "@/lib/memberContinuityMerge";

describe("member continuity conflict policy", () => {
  it("keeps the latest item without dropping distinct work from another device", () => {
    const local = {
      draft: { updatedAt: "2026-08-23T12:00:00.000Z", value: "newer local" },
      calculator: { updatedAt: "2026-08-23T10:00:00.000Z", value: "local report" },
    };
    const remote = {
      draft: { updatedAt: "2026-08-23T11:00:00.000Z", value: "older remote" },
      download: { updatedAt: "2026-08-23T11:30:00.000Z", value: "remote library item" },
    };

    expect(mergeTimestampedRecords(local, remote)).toEqual({
      draft: local.draft,
      calculator: local.calculator,
      download: remote.download,
    });
  });

  it("is deterministic for duplicate retry delivery", () => {
    const payload = {
      report: { updatedAt: "2026-08-23T12:00:00.000Z", value: "saved report" },
    };
    expect(mergeTimestampedRecords(payload, payload)).toEqual(payload);
  });
});