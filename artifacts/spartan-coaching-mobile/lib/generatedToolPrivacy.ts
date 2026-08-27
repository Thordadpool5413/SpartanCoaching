import AsyncStorage from "@react-native-async-storage/async-storage";

export const GENERATED_FIELD_TOOL_IDS = [
  "objection",
  "playbook",
  "weekly",
  "cold",
  "email",
  "research",
] as const;

const LEGACY_GENERATED_TOOL_KEY = new RegExp(
  `^hsp_tool_(?:draft|result)_v1_(?:\\d+_)?(?:${GENERATED_FIELD_TOOL_IDS.join("|")})$`,
);
const LEGACY_SAVED_RESPONSES_KEY = "spartan_saved_responses";
const LEGACY_GENERATE_QUEUE_KEY = /^hsp_offline_generate_queue_v1(?:_\d+)?$/;

/**
 * Erase generated tool text stored by prior releases. The keys may be
 * unscoped or owned by a previously signed-in member, so enumerate storage
 * rather than relying on the currently active account.
 */
export async function clearLegacyGeneratedToolStorage(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const generatedKeys = keys.filter(
    (key) =>
      LEGACY_GENERATED_TOOL_KEY.test(key) ||
      key === LEGACY_SAVED_RESPONSES_KEY ||
      LEGACY_GENERATE_QUEUE_KEY.test(key),
  );
  if (generatedKeys.length) await AsyncStorage.multiRemove(generatedKeys);
}