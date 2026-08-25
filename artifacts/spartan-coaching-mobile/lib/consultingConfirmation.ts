import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "spartan_consulting_confirmation_v1";

export type ConsultingConfirmation = {
  inquiryId: number | string;
  service: string;
  availability: string;
  submittedAt: string;
};

export async function loadConsultingConfirmation(): Promise<ConsultingConfirmation | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as ConsultingConfirmation : null;
  } catch {
    return null;
  }
}

export async function saveConsultingConfirmation(value: ConsultingConfirmation): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(value));
}

export async function clearConsultingConfirmation(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

