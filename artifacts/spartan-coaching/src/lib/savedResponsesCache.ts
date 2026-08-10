/** Must match useSavedResponses STORAGE_KEY — browser cache only. */
export const SAVED_RESPONSES_STORAGE_KEY = "spartan_saved_responses";

/** Clear browser cache of synced saved responses (call on logout). */
export function clearSavedResponsesCache(): void {
  try {
    localStorage.removeItem(SAVED_RESPONSES_STORAGE_KEY);
  } catch {
    // ignore
  }
}
