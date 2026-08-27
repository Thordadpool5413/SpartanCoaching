import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";
import { memberSyncMemberContext, validateMemberSyncMutation } from "./memberSyncRoutes";

describe("member sync route boundary", () => {
  it("derives ownership from the loaded session, not a client payload", () => {
    expect(memberSyncMemberContext({
      clientMemberId: 71,
      fieldKit: { member: { id: 71, organizationId: 19 } },
    } as never)).toEqual({ memberId: 71, organizationId: 19 });
    expect(memberSyncMemberContext({
      clientMemberId: 71,
      fieldKit: { member: { id: 71, organizationId: 0 } },
    } as never)).toBeNull();
  });

  it("accepts only bounded non-clinical tool and library records", () => {
    expect(validateMemberSyncMutation({
      mutationId: "device-a-0001",
      recordType: "library_download",
      recordId: "library:1a2b3c4d",
      payload: {
        sourceUrl: "https://example.com/library.pdf",
        title: "Objection Cards",
        kind: "resource",
        description: "Printable Field cards.",
        downloadedAt: "2026-08-23T10:00:00.000Z",
      },
      clientUpdatedAt: "2026-08-23T10:00:00.000Z",
      isDeleted: false,
    })).not.toBeNull();

    expect(validateMemberSyncMutation({
      mutationId: "device-a-0002",
      recordType: "tool_result",
      recordId: "admission-eligibility",
      payload: { result: "not allowed" },
      clientUpdatedAt: "2026-08-23T10:00:00.000Z",
      isDeleted: false,
    })).toBeNull();
  });

  it("rejects clinical or identifying prose before persistence", () => {
    const base = {
      mutationId: "device-a-0003",
      recordType: "commitment",
      recordId: "current",
      clientUpdatedAt: "2026-08-23T10:00:00.000Z",
      isDeleted: false,
    } as const;
    for (const value of [
      "Call the patient after reviewing the diagnosis.",
      "Call Jane Smith at 555-123-4567 about her cancer.",
      "Send the update to member@example.com.",
      "Record 123456789 belongs to the new referral.",
      "Meet at 12 Main Street.",
      "John Smith, born 01/02/1940, has COPD.",
    ]) {
      expect(validateMemberSyncMutation({ ...base, payload: { value } })).toBeNull();
    }
  });

  it("does not expose the retired broad continuity endpoint to persist clinical prose", async () => {
    const response = await request(app)
      .put("/api/v1/member-continuity")
      .send({
        payload: {
          toolResults: {
            weekly: {
              value: "Jane Smith has cancer and needs treatment.",
              updatedAt: "2026-08-23T10:00:00.000Z",
            },
          },
        },
      });
    expect(response.status).toBe(404);
  });
});