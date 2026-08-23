import AsyncStorage from "@react-native-async-storage/async-storage";
import { queueMemberSync } from "@/lib/memberSync";

const key = (memberId: number) => `spartan_private_commitment_v1_${memberId}`;

export async function loadCachedCommitment(memberId: number): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key(memberId));
  } catch {
    return null;
  }
}

export async function cacheCommitment(memberId: number, commitment: string | null): Promise<void> {
  try {
    if (commitment?.trim()) await AsyncStorage.setItem(key(memberId), commitment.trim());
    else await AsyncStorage.removeItem(key(memberId));
    await queueMemberSync("commitment", "current", { value: commitment?.trim() || "" }, {
      isDeleted: !commitment?.trim(),
      memberId,
    });
  } catch {
    // Home remains usable even when device storage is unavailable.
  }
}

