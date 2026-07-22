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
    const res = await fetch("/api/me/onboarding", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklistItem: { id, done: true } }),
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
