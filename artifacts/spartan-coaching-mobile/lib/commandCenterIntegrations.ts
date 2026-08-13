/**
 * Command Center integrations helpers (pass 8).
 * CSV import (manager) + calendar OAuth connect — pure rules for mobile UI.
 */

export type CsvPreviewLike = {
  headers: string[];
  rows: Record<string, string>[];
  warnings?: string[];
  formulaCells: Array<{ row: number; column: string }>;
};

export type CsvFieldKey = "accountName" | "accountType" | "address" | "externalId" | "";

/** org_admin / platform_admin map to workflow manager (import + calendar). */
export function canManageWorkflowIntegrations(
  role: string | undefined | null,
): boolean {
  return role === "org_admin" || role === "platform_admin";
}

/** Guess column mapping from header names (same heuristics as web ImportDialog). */
export function guessCsvColumnMapping(
  headers: readonly string[],
): Record<string, CsvFieldKey> {
  const guessed: Record<string, CsvFieldKey> = {};
  for (const header of headers) {
    const key = header.toLowerCase().replace(/[^a-z]/g, "");
    const isAccountName =
      ["account", "accountname", "name", "facility"].includes(key) ||
      key.includes("facility") ||
      key.endsWith("name") ||
      key === "accountname";
    if (isAccountName && !Object.values(guessed).includes("accountName")) {
      guessed[header] = "accountName";
    } else if (key.includes("type")) {
      guessed[header] = "accountType";
    } else if (key.includes("address")) {
      guessed[header] = "address";
    } else if (key.includes("external") || key === "id") {
      guessed[header] = "externalId";
    } else {
      guessed[header] = "";
    }
  }
  return guessed;
}

export function csvMappingHasAccountName(
  mapping: Record<string, string>,
): boolean {
  return Object.values(mapping).includes("accountName");
}

export function canCommitCsvImport(input: {
  preview: CsvPreviewLike | null;
  mapping: Record<string, string>;
}): boolean {
  if (!input.preview) return false;
  if (input.preview.formulaCells.length > 0) return false;
  return csvMappingHasAccountName(input.mapping);
}

export function formatCsvImportResult(input: {
  dryImported: number;
  imported: number;
  merged: number;
  rejected: number;
}): string {
  return `Validated ${input.dryImported} rows. Imported ${input.imported}, matched ${input.merged}, rejected ${input.rejected}.`;
}

export type CalendarProvider = "google" | "outlook";

export function calendarConnectPath(provider: CalendarProvider): string {
  return `/api/v1/sales-workflow/integrations/calendar/${provider}/connect`;
}

/** Redirect URI used by mobile OAuth handoff (web callback is fine for token exchange). */
export function defaultCalendarRedirectUri(originBase: string): string {
  const base = originBase.replace(/\/$/, "");
  return `${base}/integrations/calendar/callback`;
}
