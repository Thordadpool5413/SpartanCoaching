import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "spartan:calculator-reports:v1";
const MAX_REPORTS = 24;

export type CalculatorReportKind = "activity" | "roi" | "rep-cost" | "branch";

export type SavedCalculatorReport = {
  id: string;
  kind: CalculatorReportKind;
  title: string;
  summary: string;
  report: string;
  createdAt: string;
};

export async function listCalculatorReports(): Promise<SavedCalculatorReport[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function saveCalculatorReport(
  input: Omit<SavedCalculatorReport, "id" | "createdAt">,
): Promise<SavedCalculatorReport> {
  const item: SavedCalculatorReport = {
    ...input,
    id: `${input.kind}:${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const current = await listCalculatorReports();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...current].slice(0, MAX_REPORTS)));
  return item;
}

export async function deleteCalculatorReport(id: string) {
  const current = await listCalculatorReports();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter((item) => item.id !== id)));
}
