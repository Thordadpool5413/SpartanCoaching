jest.mock("../lib/api", () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

jest.mock("../lib/analytics", () => ({
  trackProductOutcome: jest.fn(),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost } from "../lib/api";
import {
  getMemberSyncStatus,
  queueMemberSync,
  setActiveSyncMember,
  syncMemberData,
} from "../lib/memberSync";
import {
  loadToolDraft,
  loadToolLastResult,
  saveToolDraft,
  saveToolLastResult,
} from "../lib/toolDraftCache";

const mockedGet = apiGet as jest.Mock;
const mockedPost = apiPost as jest.Mock;

describe("member continuity sync", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mockedGet.mockReset();
    mockedPost.mockReset();
    setActiveSyncMember(null);
  });

  it("keeps an offline edit pending and flushes it once connected", async () => {
    setActiveSyncMember(41);
    await queueMemberSync("tool_result", "objection", { result: "Use a calm redirect." });
    mockedGet.mockRejectedValueOnce(new Error("offline"));
    await syncMemberData(41);
    expect(getMemberSyncStatus()).toBe("unavailable");

    mockedGet.mockResolvedValueOnce({ records: [], serverTime: "2026-08-23T10:00:00.000Z" });
    mockedPost.mockImplementationOnce(async (_path: string, body: { mutations: unknown[] }) => ({
      records: body.mutations,
      serverTime: "2026-08-23T10:00:01.000Z",
    }));
    await syncMemberData(41);
    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(getMemberSyncStatus()).toBe("synced");
    expect(await loadToolLastResult("objection")).toBe("Use a calm redirect.");
  });

  it("does not redeliver an already acknowledged mutation", async () => {
    setActiveSyncMember(42);
    await queueMemberSync("tool_draft", "weekly", { draft: { goal: "Ten visits" } });
    mockedGet.mockResolvedValue({ records: [], serverTime: "2026-08-23T10:00:00.000Z" });
    mockedPost.mockImplementation(async (_path: string, body: { mutations: unknown[] }) => ({
      records: body.mutations,
      serverTime: "2026-08-23T10:00:01.000Z",
    }));
    await syncMemberData(42);
    await syncMemberData(42);
    expect(mockedPost).toHaveBeenCalledTimes(1);
  });

  it("keeps an edit made during a flush for the next retry", async () => {
    setActiveSyncMember(421);
    await queueMemberSync("tool_result", "objection", { result: "First version" });
    mockedGet.mockResolvedValue({ records: [], serverTime: "2026-08-23T10:00:00.000Z" });
    let resolvePost: ((value: unknown) => void) | undefined;
    mockedPost.mockImplementationOnce((_path: string, body: { mutations: unknown[] }) =>
      new Promise((resolve) => {
        resolvePost = () => resolve({
          records: body.mutations,
          serverTime: "2026-08-23T10:00:01.000Z",
        });
      }),
    );
    const flushing = syncMemberData(421);
    for (let attempt = 0; !resolvePost && attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(resolvePost).toBeDefined();
    await queueMemberSync("tool_result", "objection", { result: "Second version" });
    resolvePost?.(undefined);
    await flushing;

    mockedPost.mockImplementationOnce(async (_path: string, body: { mutations: unknown[] }) => ({
      records: body.mutations,
      serverTime: "2026-08-23T10:00:02.000Z",
    }));
    await syncMemberData(421);
    expect(mockedPost).toHaveBeenCalledTimes(2);
    expect(await loadToolLastResult("objection")).toBe("Second version");
  });

  it("restores a remote draft after a reinstall-style empty cache", async () => {
    setActiveSyncMember(43);
    mockedGet.mockResolvedValueOnce({
      records: [{
        recordType: "tool_draft",
        recordId: "weekly",
        mutationId: "device-b-0001",
        payload: { draft: { goal: "Renew referral relationships" } },
        clientUpdatedAt: "2026-08-23T10:00:00.000Z",
        isDeleted: false,
      }],
      serverTime: "2026-08-23T10:00:01.000Z",
    });
    await syncMemberData(43);
    expect(await loadToolDraft("weekly")).toEqual({ goal: "Renew referral relationships" });
  });

  it("adopts permitted legacy device work once for the first authenticated member", async () => {
    await AsyncStorage.setItem("hsp_tool_draft_v1_weekly", JSON.stringify({ goal: "Build referral trust" }));
    await AsyncStorage.setItem("hsp_tool_result_v1_weekly", "Lead with a specific observation.");
    await AsyncStorage.setItem("spartan:calculator-reports:v1", JSON.stringify([{
      id: "activity:1", kind: "activity", title: "Activity plan", summary: "Summary", report: "Report", createdAt: "2026-08-23T10:00:00.000Z",
    }]));
    await AsyncStorage.setItem("spartan_library_downloads_v1", JSON.stringify({
      "https://example.test/library/guide.pdf": { title: "Guide", kind: "resource", downloadedAt: "2026-08-23T10:00:00.000Z", localUri: "file:///guide.pdf" },
    }));
    setActiveSyncMember(49);
    mockedGet.mockResolvedValueOnce({ records: [], serverTime: "2026-08-23T10:00:00.000Z" });
    mockedPost.mockImplementationOnce(async (_path: string, body: { mutations: unknown[] }) => ({
      records: body.mutations, serverTime: "2026-08-23T10:00:01.000Z",
    }));

    await syncMemberData(49);

    expect(await loadToolDraft("weekly")).toEqual({ goal: "Build referral trust" });
    expect(await loadToolLastResult("weekly")).toBe("Lead with a specific observation.");
    expect(await AsyncStorage.getItem("spartan:calculator-reports:v1_49")).toContain("activity:1");
    expect(await AsyncStorage.getItem("spartan_library_downloads_v1_49")).toContain("guide.pdf");
    expect(mockedPost).toHaveBeenCalledWith("/api/v1/member-sync", expect.objectContaining({
      mutations: expect.arrayContaining([
        expect.objectContaining({ recordType: "tool_draft", recordId: "weekly" }),
        expect.objectContaining({ recordType: "calculator_report", recordId: "calc:activity:1" }),
        expect.objectContaining({ recordType: "library_download", recordId: "library:7645f539" }),
      ]),
    }));

    setActiveSyncMember(50);
    await syncMemberData(50);
    expect(await loadToolDraft("weekly")).toBeNull();
  });

  it("never exposes one member's cached work to another member", async () => {
    setActiveSyncMember(44);
    await saveToolDraft("weekly", { goal: "Member A only" });
    await saveToolLastResult("weekly", "A's saved result");
    setActiveSyncMember(45);
    expect(await loadToolDraft("weekly")).toBeNull();
    expect(await loadToolLastResult("weekly")).toBeNull();
  });

  it("does not persist or queue potential PHI in field-tool drafts or results", async () => {
    setActiveSyncMember(46);
    await saveToolDraft("weekly", {
      goal: "Follow up with patient Maria Lopez after her COPD admission",
    });
    await saveToolLastResult("weekly", "Patient DOB: 08/12/1948 needs a call.");

    expect(await loadToolDraft("weekly")).toBeNull();
    expect(await loadToolLastResult("weekly")).toBeNull();
    expect(await AsyncStorage.getItem("hsp_tool_draft_v1_46_weekly")).toBeNull();
    expect(await AsyncStorage.getItem("hsp_tool_result_v1_46_weekly")).toBeNull();
    expect(await AsyncStorage.getItem("hsp_member_sync_pending_v1_46")).toBeNull();
  });

  it("does not queue an account A write under account B after a mid-write switch", async () => {
    setActiveSyncMember(46);
    setActiveSyncMember(47);
    await queueMemberSync("tool_draft", "weekly", { draft: { goal: "A-owned draft" } }, { memberId: 46 });

    mockedGet.mockResolvedValueOnce({ records: [], serverTime: "2026-08-23T10:00:00.000Z" });
    await syncMemberData(47);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("keeps a sensitive local-only item from blocking later safe work", async () => {
    setActiveSyncMember(48);
    await queueMemberSync("commitment", "current", { value: "Call the patient with COPD." });
    await queueMemberSync("tool_result", "objection", { result: "Use a calm redirect." });
    expect(getMemberSyncStatus()).toBe("pending");
    expect(await AsyncStorage.getItem("hsp_member_sync_pending_v1_48")).toContain("objection");
    mockedGet.mockResolvedValueOnce({ records: [], serverTime: "2026-08-23T10:00:00.000Z" });
    mockedPost.mockImplementationOnce(async (_path: string, body: { mutations: Array<{ recordId: string }> }) => ({
      records: body.mutations,
      rejected: [],
      serverTime: "2026-08-23T10:00:01.000Z",
    }));

    await syncMemberData(48);
    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith(
      "/api/v1/member-sync",
      expect.objectContaining({ mutations: [expect.objectContaining({ recordId: "objection" })] }),
    );
  });
});