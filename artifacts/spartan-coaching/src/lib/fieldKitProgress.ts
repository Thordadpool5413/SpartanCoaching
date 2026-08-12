import type { ChecklistId } from "@/lib/fieldKitCatalog";

export const CHECKLIST_LABELS: Record<ChecklistId, string> = {
  objection: "Handle one real objection",
  weekly_plan: "Build this week's plan",
  roleplay: "Role-play your toughest scenario",
  director_scorecard: "Run the activity / scorecard math",
  debrief: "Book a debrief call",
};

/** Mark a portal checklist item complete after real tool use. */
export async function markFieldKitChecklistDone(id: ChecklistId): Promise<boolean> {
  try {
    // Map tool use into activation steps when applicable (HSP-39)
    const activationMap: Partial<Record<ChecklistId, string>> = {
      objection: "activation_practice",
      weekly_plan: "activation_call_prep",
      roleplay: "activation_practice",
      director_scorecard: "activation_team_math",
    };
    const activationId = activationMap[id];
    const body: Record<string, unknown> = {
      checklistItem: { id, done: true },
    };
    if (activationId) {
      body.activationStep = { id: activationId, done: true };
    }
    const res = await fetch("/api/me/onboarding", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("field-kit-checklist-done", {
          detail: { id, label: CHECKLIST_LABELS[id] },
        }),
      );
    }
    return res.ok;
  } catch {
    return false;
  }
}
