import { describe, expect, it } from "vitest";
import {
  emptyMemberContinuityPayload,
  memberContinuityPayloadSchema,
  mergeMemberContinuityPayload,
} from "@workspace/db";

describe("member continuity contract", () => {
  it("merges device payloads per item so separate work survives a reinstall or second device", () => {
    const original = emptyMemberContinuityPayload();
    original.toolDrafts.objection = {
      value: { objection: "Older draft" },
      updatedAt: "2026-08-23T10:00:00.000Z",
    };
    original.calculatorReports.activity = {
      id: "activity",
      kind: "activity",
      title: "Activity targets",
      summary: "Original saved report",
      report: "Report text",
      createdAt: "2026-08-23T10:00:00.000Z",
      updatedAt: "2026-08-23T10:00:00.000Z",
    };
    const secondDevice = emptyMemberContinuityPayload();
    secondDevice.toolDrafts.objection = {
      value: { objection: "Newer draft" },
      updatedAt: "2026-08-23T11:00:00.000Z",
    };
    secondDevice.downloads["https://example.test/guide.pdf"] = {
      sourceUrl: "https://example.test/guide.pdf",
      title: "Guide",
      kind: "resource",
      updatedAt: "2026-08-23T10:30:00.000Z",
    };

    const merged = mergeMemberContinuityPayload(original, secondDevice);
    expect(merged.toolDrafts.objection.value.objection).toBe("Newer draft");
    expect(merged.calculatorReports.activity.summary).toBe("Original saved report");
    expect(merged.downloads["https://example.test/guide.pdf"].title).toBe("Guide");
  });

  it("is safe to retry the same full snapshot without duplicating work", () => {
    const payload = emptyMemberContinuityPayload();
    payload.toolResults.email = {
      value: "A field-ready email",
      updatedAt: "2026-08-23T12:00:00.000Z",
    };
    expect(mergeMemberContinuityPayload(payload, payload)).toEqual(payload);
  });

  it("rejects oversized continuity collections before a write", () => {
    const payload = emptyMemberContinuityPayload();
    for (let index = 0; index < 9; index += 1) {
      payload.toolResults[`tool-${index}`] = {
        value: "result",
        updatedAt: "2026-08-23T12:00:00.000Z",
      };
    }
    expect(memberContinuityPayloadSchema.safeParse(payload).success).toBe(false);
  });
});