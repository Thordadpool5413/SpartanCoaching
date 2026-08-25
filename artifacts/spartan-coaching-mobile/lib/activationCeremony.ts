/**
 * One-time post-subscribe / unlock ceremony (AsyncStorage).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const seenKey = (memberId: number | string) => `hsp_activation_seen_v1_${memberId}`;

export async function hasSeenActivation(memberId: number): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(seenKey(memberId))) === "1";
  } catch {
    return true; // fail closed — don't loop modals
  }
}

export async function markActivationSeen(memberId: number): Promise<void> {
  try {
    await AsyncStorage.setItem(seenKey(memberId), "1");
  } catch {
    // ignore
  }
}
