import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "coach-handoff";

export type CoachHandoff = {
  situation: string;
  intention: string;
};

export async function saveCoachHandoff(handoff: CoachHandoff) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(handoff));
}

export async function consumeCoachHandoff(): Promise<CoachHandoff | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(STORAGE_KEY);
  try {
    const parsed = JSON.parse(raw) as Partial<CoachHandoff>;
    if (typeof parsed.situation !== "string" || typeof parsed.intention !== "string") return null;
    return { situation: parsed.situation, intention: parsed.intention };
  } catch {
    return null;
  }
}
