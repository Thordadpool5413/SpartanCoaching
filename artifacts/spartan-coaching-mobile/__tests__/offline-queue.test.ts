import { ApiError } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import fs from "node:fs";
import path from "node:path";
import {
  clearGenerateQueue,
  enqueueGenerate,
  shouldEnqueueOnError,
  userFacingApiError,
  isOfflineQueueAllowed,
  flushNeedsReauth,
  OFFLINE_QUEUE_ALLOWED_PATHS,
  type FlushResult,
} from "@/lib/offlineQueue";
import { setActiveSyncMember } from "@/lib/memberSync";

describe("offline queue error policy", () => {
  it("enqueues on network-like errors (non-ApiError)", () => {
    expect(shouldEnqueueOnError(new Error("Failed to fetch"))).toBe(true);
    expect(shouldEnqueueOnError("boom")).toBe(true);
  });

  it("enqueues on 5xx ApiError", () => {
    expect(shouldEnqueueOnError(new ApiError("server", 500))).toBe(true);
    expect(shouldEnqueueOnError(new ApiError("bad gateway", 502))).toBe(true);
  });

  it("does not enqueue on 401/403/4xx (auth must succeed before queueing new work)", () => {
    expect(shouldEnqueueOnError(new ApiError("auth", 401))).toBe(false);
    expect(shouldEnqueueOnError(new ApiError("denied", 403))).toBe(false);
    expect(shouldEnqueueOnError(new ApiError("bad", 422))).toBe(false);
  });

  it("maps access and network errors for users without claiming offline AI", () => {
    expect(userFacingApiError(new ApiError("x", 403))).toMatch(/Hospice Sales Pro/);
    expect(userFacingApiError(new ApiError("Too long", 400))).toBe("Too long");
    expect(userFacingApiError(new Error("Failed to fetch"))).toMatch(/internet|Network/i);
  });

  it("flags flush when auth expired", () => {
    const result: FlushResult = {
      ok: 0,
      failed: 1,
      authExpired: true,
      results: [{ toolId: "objection", error: "auth_expired" }],
    };
    expect(flushNeedsReauth(result)).toBe(true);
    expect(
      flushNeedsReauth({ ok: 1, failed: 0, authExpired: false, results: [] }),
    ).toBe(false);
  });
});

describe("offline queue PHI / clinical allowlist", () => {
  it("allows classic Field tool paths", () => {
    for (const path of OFFLINE_QUEUE_ALLOWED_PATHS) {
      expect(isOfflineQueueAllowed(path, "objections")).toBe(true);
    }
  });

  it("blocks clinical and advanced AI paths", () => {
    expect(isOfflineQueueAllowed("/api/ai-tools/run", "content-generator")).toBe(
      false,
    );
    expect(
      isOfflineQueueAllowed("/api/ai-tools/admission-eligibility/run", "admission-eligibility"),
    ).toBe(false);
    expect(isOfflineQueueAllowed("/api/v1/sales-workflow/debrief/draft")).toBe(
      false,
    );
    expect(isOfflineQueueAllowed("/api/transcribe", "transcribe")).toBe(false);
    expect(isOfflineQueueAllowed("/api/roleplay/sessions", "role-play")).toBe(
      false,
    );
  });

  it("blocks clinical tool ids even on a classic path", () => {
    expect(
      isOfflineQueueAllowed("/api/objections", "medical-record-lcd-verifier"),
    ).toBe(false);
    expect(
      isOfflineQueueAllowed("/api/objections", "admission-eligibility"),
    ).toBe(false);
  });

  it("retires legacy queue data at app startup without flushing its request body", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "..", "components", "DeepLinkRouter.tsx"),
      "utf8",
    );
    expect(source).toContain("clearGenerateQueue");
    expect(source).not.toContain("flushGenerateQueue");
  });

  it("erases legacy queues for every prior member without retrying their input", async () => {
    const keys = [
      "hsp_offline_generate_queue_v1",
      "hsp_offline_generate_queue_v1_7346",
      "hsp_offline_generate_queue_v1_7347",
    ];
    setActiveSyncMember(7346);
    await Promise.all(keys.map((key) => AsyncStorage.setItem(
      key,
      JSON.stringify([{ body: { name: "private" } }]),
    )));

    await clearGenerateQueue();

    await Promise.all(keys.map(async (key) => {
      expect(await AsyncStorage.getItem(key)).toBeNull();
    }));
    setActiveSyncMember(null);
  });

  it("does not persist a request when an older caller tries to enqueue one", async () => {
    const result = await enqueueGenerate({
      toolId: "objection",
      path: "/api/objections",
      body: { objection: "Private member context" },
      label: "Objection",
    });

    expect(result).toBeNull();
    expect(await AsyncStorage.getItem("hsp_offline_generate_queue_v1")).toBeNull();
  });
});
