import AsyncStorage from "@react-native-async-storage/async-storage";
import { getActiveSyncMemberId, queueMemberSync } from "@/lib/memberSync";
import { markContinuityChanged } from "@/lib/continuityEvents";

const storageKeyForMember = (memberId: number | null) => {
  return memberId ? `spartan:calculator-reports:v1_${memberId}` : "spartan:calculator-reports:v1";
};
const STORAGE_KEY = () => storageKeyForMember(getActiveSyncMemberId());
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
  const raw = await AsyncStorage.getItem(STORAGE_KEY());
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
  const memberId = getActiveSyncMemberId();
  const raw = await AsyncStorage.getItem(storageKeyForMember(memberId));
  const current = raw ? JSON.parse(raw) as SavedCalculatorReport[] : [];
  await AsyncStorage.setItem(storageKeyForMember(memberId), JSON.stringify([item, ...current].slice(0, MAX_REPORTS)));
  if (memberId) await queueMemberSync("calculator_report", `calc:${item.id}`, item, { memberId });
  markContinuityChanged();
  return item;
}

export async function deleteCalculatorReport(id: string) {
  const memberId = getActiveSyncMemberId();
  const raw = await AsyncStorage.getItem(storageKeyForMember(memberId));
  const current = raw ? JSON.parse(raw) as SavedCalculatorReport[] : [];
  await AsyncStorage.setItem(storageKeyForMember(memberId), JSON.stringify(current.filter((item) => item.id !== id)));
  if (memberId) await queueMemberSync("calculator_report", `calc:${id}`, {}, { isDeleted: true, memberId });
  markContinuityChanged();
}

export async function getCalculatorContinuityReports(): Promise<Record<string, ContinuityCalculatorReport>> {
  const reports = await listCalculatorReports();
  return Object.fromEntries(reports.map((report) => [report.id, { ...report, updatedAt: report.createdAt }]));
}

export async function applyCalculatorContinuityReports(reports: Record<string, ContinuityCalculatorReport>) {
  const local = await getCalculatorContinuityReports();
  const merged = Object.values({ ...local, ...reports })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, MAX_REPORTS)
    .map(({ updatedAt: _updatedAt, ...report }) => report);
  await AsyncStorage.setItem(STORAGE_KEY(), JSON.stringify(merged));
}

export async function clearCalculatorContinuityReports() {
  await AsyncStorage.removeItem(STORAGE_KEY());
}
