import AsyncStorage from "@react-native-async-storage/async-storage";

const TOUR_STATE_KEY = "spartan:guided-tour:v2";

export type GuidedTourState = {
  status: "started" | "completed" | "dismissed";
  step: number;
  updatedAt: string;
};

export async function getGuidedTourState(): Promise<GuidedTourState | null> {
  const raw = await AsyncStorage.getItem(TOUR_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GuidedTourState;
  } catch {
    return null;
  }
}

export async function beginGuidedTour() {
  const current = await getGuidedTourState();
  if (current) return current;
  const state: GuidedTourState = { status: "started", step: 0, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(TOUR_STATE_KEY, JSON.stringify(state));
  return state;
}

export async function saveGuidedTourStep(step: number) {
  const state: GuidedTourState = { status: "started", step, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(TOUR_STATE_KEY, JSON.stringify(state));
}

export async function completeGuidedTour() {
  const state: GuidedTourState = { status: "completed", step: 5, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(TOUR_STATE_KEY, JSON.stringify(state));
}

export async function dismissGuidedTour(step: number) {
  const state: GuidedTourState = { status: "dismissed", step, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(TOUR_STATE_KEY, JSON.stringify(state));
}

export async function shouldAutoPresentGuidedTour() {
  return (await getGuidedTourState()) === null;
}
