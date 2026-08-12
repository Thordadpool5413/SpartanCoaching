import { describe, it, expect } from "vitest";
import {
  ACTIVATION_VERSION,
  activationStepsForRole,
  evaluateActivation,
  normalizeActivationRole,
  withAutoActivationComplete,
  isProgressDone,
} from "./activation-loop";

describe("activation loop (HSP-39)", () => {
  it("is versioned", () => {
    expect(ACTIVATION_VERSION).toMatch(/^activation-v\d+/);
  });

  it("maps org admin to admin loop", () => {
    expect(normalizeActivationRole("rep", "org_admin")).toBe("admin");
    expect(activationStepsForRole("admin").some((s) => s.id === "activation_admin_seats")).toBe(
      true,
    );
  });

  it("rep loop includes account → prep → outcome → next action", () => {
    const ids = activationStepsForRole("rep").map((s) => s.id);
    expect(ids).toContain("activation_first_account");
    expect(ids).toContain("activation_call_prep");
    expect(ids).toContain("activation_outcome");
    expect(ids).toContain("activation_next_action");
    expect(ids).toContain("activation_practice");
    const practice = activationStepsForRole("rep").find((s) => s.id === "activation_practice");
    expect(practice?.required).toBe(false);
  });

  it("new user is not activated by empty progress", () => {
    const view = evaluateActivation({ jobRole: null, progress: {} });
    expect(view.activated).toBe(false);
    expect(view.nextStep?.id).toBe("activation_role_context");
  });

  it("jobRole alone completes role_context step", () => {
    const view = evaluateActivation({ jobRole: "rep", progress: {} });
    const roleStep = view.steps.find((s) => s.id === "activation_role_context");
    expect(roleStep?.done).toBe(true);
    expect(view.nextStep?.id).toBe("activation_first_account");
  });

  it("skip marks activated for experienced users", () => {
    const view = evaluateActivation({
      jobRole: "rep",
      progress: { activation_skipped: new Date().toISOString() },
    });
    expect(view.skipped).toBe(true);
    expect(view.activated).toBe(true);
    expect(view.nextStep).toBeNull();
  });

  it("legacy checklist marks can satisfy optional practice", () => {
    const view = evaluateActivation({
      jobRole: "rep",
      progress: { objection: new Date().toISOString() },
    });
    const practice = view.steps.find((s) => s.id === "activation_practice");
    expect(practice?.done).toBe(true);
  });

  it("auto-stamps activation_complete when required steps done", () => {
    const steps = activationStepsForRole("rep").filter((s) => s.required);
    const progress: Record<string, boolean | string> = { jobRole: "rep" };
    // role context via jobRole in evaluate; stamp all required ids
    for (const s of steps) {
      progress[s.id] = new Date().toISOString();
    }
    const next = withAutoActivationComplete(progress, "rep", "member");
    expect(isProgressDone(next, "activation_complete")).toBe(true);
    const view = evaluateActivation({ jobRole: "rep", progress: next });
    expect(view.activated).toBe(true);
  });

  it("leader loop includes team math", () => {
    const ids = activationStepsForRole("director").map((s) => s.id);
    expect(ids).toContain("activation_team_math");
    expect(ids).not.toContain("activation_practice");
  });
});
