import { describe, expect, it } from "vitest";
import {
  GetMemberSyncQueryParams,
  GetMemberSyncResponse,
  GetSalesWorkflowTodayQueryParams,
  LoginBody,
  LoginResponse,
  PostMemberSyncBody,
  PostMemberSyncResponse,
  CreateMemberWorkBody,
  SaveResourceWorkBody,
  CreateProviderResourceBody,
} from "./index";

describe("generated API validators preserve transport contracts", () => {
  it("validates session envelopes and member sync envelopes", () => {
    expect(LoginBody.safeParse({ email: "member@example.com", password: "secret" }).success).toBe(true);
    const session = LoginResponse.parse({ member: { id: 1, futureField: "kept" }, fieldKit: { allowed: true } });
    expect(session.member?.futureField).toBe("kept");
    expect(
      GetMemberSyncResponse.safeParse({
        records: [{ recordType: "member-work", recordId: "1", mutationId: "m1", payload: { output: { ok: true } }, clientUpdatedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false }],
        serverTime: new Date().toISOString(),
      }).success,
    ).toBe(true);
    expect(
      PostMemberSyncResponse.safeParse({
        records: [], serverTime: new Date().toISOString(), conflicts: 0, rejected: [{ mutationId: "bad", code: "INVALID_SYNC_MUTATION" }],
      }).success,
    ).toBe(true);
  });

  it("accepts member work and resource payloads without stripping broad records", () => {
    expect(CreateMemberWorkBody.safeParse({
      kind: "tool_result", toolId: "objection", title: "Practice", output: { custom: { nested: true } },
    }).success).toBe(true);
    expect(SaveResourceWorkBody.safeParse({ formData: { arbitrary: ["payload"] }, status: "draft" }).success).toBe(true);
    expect(CreateProviderResourceBody.safeParse({ title: "Guide", fileUrl: "https://example.com/guide.pdf", meta: { custom: true } }).success).toBe(true);
  });

  it("keeps query date values as strings at the HTTP boundary", () => {
    const value = "2026-01-02T03:04:05.000Z";
    expect(GetMemberSyncQueryParams.parse({ since: value }).since).toBe(value);
    expect(GetSalesWorkflowTodayQueryParams.parse({ from: value, to: value }).from).toBe(value);
  });
});