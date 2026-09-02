import { describe, expect, it } from "vitest";
import { normalizeMemberSync } from "./MyWork";

const timestamp = "2026-09-01T12:00:00.000Z";

describe("My Work member sync normalization", () => {
  it("restores supported iPhone records into the web workspace", () => {
    const result = normalizeMemberSync({
      records: [
        {
          recordType: "commitment",
          recordId: "current",
          payload: { value: "Confirm Thursday follow-up" },
          clientUpdatedAt: timestamp,
          updatedAt: timestamp,
          isDeleted: false,
        },
        {
          recordType: "tool_draft",
          recordId: "weekly",
          payload: { draft: { goal: "Build referral trust", ignored: 42 } },
          clientUpdatedAt: timestamp,
          updatedAt: timestamp,
          isDeleted: false,
        },
        {
          recordType: "calculator_report",
          recordId: "calc:activity:1",
          payload: {
            id: "activity:1",
            kind: "activity",
            title: "Weekly activity",
            summary: "Ten conversations",
            report: "Saved report",
            createdAt: timestamp,
          },
          clientUpdatedAt: timestamp,
          updatedAt: timestamp,
          isDeleted: false,
        },
      ],
    });

    expect(result.commitment?.value).toBe("Confirm Thursday follow-up");
    expect(result.payload.toolDrafts.weekly.value).toEqual({ goal: "Build referral trust" });
    expect(result.payload.calculatorReports["calc:activity:1"]).toMatchObject({
      id: "activity:1",
      kind: "activity",
      title: "Weekly activity",
    });
  });

  it("does not restore deleted or malformed records", () => {
    const result = normalizeMemberSync({
      records: [
        {
          recordType: "commitment",
          recordId: "current",
          payload: { value: "Old commitment" },
          clientUpdatedAt: timestamp,
          updatedAt: timestamp,
          isDeleted: true,
        },
        {
          recordType: "library_download",
          recordId: "library:invalid",
          payload: { sourceUrl: "", kind: "unknown" },
          clientUpdatedAt: timestamp,
          updatedAt: timestamp,
          isDeleted: false,
        },
      ],
    });

    expect(result.commitment).toBeNull();
    expect(result.payload.downloads).toEqual({});
  });
});
