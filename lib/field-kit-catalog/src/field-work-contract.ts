/**
 * Shared field-work vocabulary for web, iOS, and the API.
 *
 * Content remains server-owned and privacy-filtered. These values describe
 * delivery state only, so both clients can explain what happened without
 * exposing prompts, drafts, or generated output in telemetry.
 */

export const FIELD_WORK_CONTRACT_VERSION = 1 as const;

export const FIELD_WORK_STATUSES = ["draft", "completed", "failed"] as const;
export type FieldWorkStatus = (typeof FIELD_WORK_STATUSES)[number];

export const FIELD_WORK_STATES = [
  "local_only",
  "pending",
  "synced",
  "completed",
  "failed",
] as const;
export type FieldWorkState = (typeof FIELD_WORK_STATES)[number];

export type FieldWorkNextAction = {
  title: string;
  href?: string;
  dueAt?: string;
};

export function fieldWorkStateForStatus(
  status: string,
  delivery: "local_only" | "pending" | "synced" = "synced",
): FieldWorkState {
  if (status === "failed") return "failed";
  if (status === "completed") return delivery === "synced" ? "completed" : delivery;
  return delivery;
}

/** Keep resume URLs internal and bounded when a client adds a saved-work ID. */
export function withFieldWorkResume(
  href: string,
  workId: string | null | undefined,
): string {
  if (!workId || !/^[0-9a-f-]{36}$/i.test(workId)) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}work=${encodeURIComponent(workId)}`;
}