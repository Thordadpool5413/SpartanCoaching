import AsyncStorage from "@react-native-async-storage/async-storage";
import { markContinuityChanged } from "@/lib/continuityEvents";

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

export type ContinuityCalculatorReport = SavedCalculatorReport & { updatedAt: string };

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
  markContinuityChanged();
  return item;
}

export async function deleteCalculatorReport(id: string) {
  const current = await listCalculatorReports();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter((item) => item.id !== id)));
  markContinuityChanged();
}

export async function getCalculatorContinuityReports(): Promise<Record<string, ContinuityCalculatorReport>> {
  const reports = await listCalculatorReports();
  return Object.fromEntries(reports.map((report) => [
    report.id,
    { ...report, updatedAt: report.createdAt },
  ]));
}

export async function applyCalculatorContinuityReports(
  remoteReports: Record<string, ContinuityCalculatorReport>,
): Promise<void> {
  const local = await getCalculatorContinuityReports();
  const merged = new Map<string, ContinuityCalculatorReport>();
  for (const id of new Set([...Object.keys(local), ...Object.keys(remoteReports)])) {
    const localItem = local[id];
    const remoteItem = remoteReports[id];
    merged.set(
      id,
      !localItem || (remoteItem && Date.parse(remoteItem.updatedAt) > Date.parse(localItem.updatedAt))
        ? remoteItem!
        : localItem,
    );
  }
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      [...merged.values()]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, MAX_REPORTS)
        .map(({ updatedAt: _updatedAt, ...report }) => report),
    ),
  );
}

export async function clearCalculatorContinuityReports(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
