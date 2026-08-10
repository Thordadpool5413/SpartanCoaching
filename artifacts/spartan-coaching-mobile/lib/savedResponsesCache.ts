import AsyncStorage from "@react-native-async-storage/async-storage";

/** Must match useSavedResponses STORAGE_KEY — device cache only. */
export const SAVED_RESPONSES_STORAGE_KEY = "spartan_saved_responses";

/** Clear device cache of synced saved responses (call on logout). */
export async function clearSavedResponsesCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SAVED_RESPONSES_STORAGE_KEY);
  } catch {
    // ignore
  }
}
