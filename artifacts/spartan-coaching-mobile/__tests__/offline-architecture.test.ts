import {
  OFFLINE_WORKFLOW_MATRIX,
  classifyGenerateAttempt,
  getOfflineWorkflow,
  isAiGenerationOfflineClaimAllowed,
  onlineRequiredMessage,
} from "@/lib/offlineArchitecture";
import { isOfflineQueueAllowed } from "@/lib/offlineQueue";

describe("offline architecture matrix", () => {
  it("never claims AI generation works offline", () => {
    for (const w of OFFLINE_WORKFLOW_MATRIX) {
      expect(w.aiWorksOffline).toBe(false);
      expect(isAiGenerationOfflineClaimAllowed(w.id)).toBe(false);
    }
  });

  it("classifies classic field as queued_write and clinical as online_required", () => {
    expect(
      classifyGenerateAttempt({
        path: "/api/objections",
        toolId: "objection",
        queueIsAllowed: isOfflineQueueAllowed("/api/objections", "objection"),
      }),
    ).toBe("queued_write");

    expect(
      classifyGenerateAttempt({
        path: "/api/ai-tools/run",
        toolId: "admission-eligibility",
        queueIsAllowed: isOfflineQueueAllowed(
          "/api/ai-tools/run",
          "admission-eligibility",
        ),
      }),
    ).toBe("online_required");
  });

  it("command center and billing require online", () => {
    expect(getOfflineWorkflow("command_center")?.capability).toBe(
      "online_required",
    );
    expect(getOfflineWorkflow("billing_checkout")?.capability).toBe(
      "online_required",
    );
    expect(getOfflineWorkflow("clinical_vault")?.capability).toBe(
      "online_required",
    );
  });

  it("drafts are offline capable; saved view is read-only cached", () => {
    expect(getOfflineWorkflow("tool_draft_and_last_result")?.capability).toBe(
      "offline_capable",
    );
    expect(getOfflineWorkflow("saved_responses_view")?.capability).toBe(
      "read_only_cached",
    );
  });

  it("user messages do not claim offline AI", () => {
    const msg = onlineRequiredMessage("classic_field_generate");
    expect(msg.toLowerCase()).toMatch(/network|internet|online/);
    expect(msg.toLowerCase()).not.toMatch(/works offline|offline ai/);
  });
});
