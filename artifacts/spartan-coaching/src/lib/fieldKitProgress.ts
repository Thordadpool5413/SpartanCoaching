import type { ChecklistId } from "@/lib/fieldKitCatalog";

/** Mark a portal checklist item complete after real tool use. */
export async function markFieldKitChecklistDone(id: ChecklistId): Promise<boolean> {
  try {
    const res = await fetch("/api/me/onboarding", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklistItem: { id, done: true } }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
