import type { MemberWorkErrorCode, MemberWorkErrorResponse } from "@workspace/api-contract";

export type MemberWorkItem = { id: string; toolId: string; title: string; kind: string; status: string; syncState?: "synced" | "completed" | "failed"; input: Record<string, unknown>; output: Record<string, unknown>; nextAction?: { title: string; href?: string } | null; updatedAt: string };
export type SaveMemberWork = { toolId: string; title: string; value: string; kind?: "tool_result" | "calculator_report" | "intelligence_brief" | "roleplay" | "transcript" | "resource_work"; status?: "draft" | "completed" | "failed"; accountId?: string | null; input?: Record<string, unknown>; nextAction?: { title: string; href?: string; dueAt?: string } | null };
export class MemberWorkApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: MemberWorkErrorCode | string,
  ) {
    super(message);
    this.name = "MemberWorkApiError";
  }
}

async function json<T extends Record<string, unknown>>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({})) as Partial<MemberWorkErrorResponse> & { code?: string; error?: string | MemberWorkErrorResponse["error"] };
  if (!response.ok) {
    const error = data.error;
    if (error && typeof error === "object") {
      throw new MemberWorkApiError(error.message || "Saved work is unavailable.", response.status, error.code);
    }
    throw new MemberWorkApiError(typeof error === "string" ? error : "Saved work is unavailable.", response.status, data.code);
  }
  return data as T;
}
export async function saveMemberWork(work: SaveMemberWork): Promise<MemberWorkItem> {
  const idempotencyKey = globalThis.crypto?.randomUUID?.() ?? `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return (await json<{ item: MemberWorkItem }>(await fetch("/api/v1/member-work", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ kind: work.kind ?? "tool_result", toolId: work.toolId, title: work.title, status: work.status ?? "completed", accountId: work.accountId ?? null, input: work.input ?? {}, output: { text: work.value }, nextAction: work.nextAction ?? null, sourcePlatform: "web" }) }))).item;
}
export async function loadMemberWork(): Promise<MemberWorkItem[]> { return (await json<{ items: MemberWorkItem[] }>(await fetch("/api/v1/member-work", { credentials: "include" }))).items; }
export async function loadMemberWorkItem(id: string): Promise<MemberWorkItem> { return (await json<{ item: MemberWorkItem }>(await fetch(`/api/v1/member-work/${encodeURIComponent(id)}`, { credentials: "include" }))).item; }
