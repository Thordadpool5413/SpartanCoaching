import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSafeForMemberContinuity, queueMemberSync } from "@/lib/memberSync";

const key = (memberId: number) => `spartan_private_commitment_v1_${memberId}`;

export async function loadCachedCommitment(memberId: number): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key(memberId));
  } catch {
    return null;
  }
}

export async function cacheCommitment(memberId: number, commitment: string | null): Promise<void> {
  const normalized = commitment?.trim() || "";
  if (normalized && !isSafeForMemberContinuity({ value: normalized })) return;
  try {
    if (normalized) await AsyncStorage.setItem(key(memberId), normalized);
    else await AsyncStorage.removeItem(key(memberId));
    await queueMemberSync("commitment", "current", { value: normalized }, {
      isDeleted: !normalized,
      memberId,
    });
  } catch {
    // Home remains usable even when device storage is unavailable.
  }
}

