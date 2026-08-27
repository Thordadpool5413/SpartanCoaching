import { apiGet, apiPut } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  applyCalculatorContinuityReports,
  clearCalculatorContinuityReports,
  getCalculatorContinuityReports,
  type ContinuityCalculatorReport,
} from "@/lib/calculatorHistory";
import { cacheCommitment } from "@/lib/commitmentCache";
import { onContinuityChanged } from "@/lib/continuityEvents";
import {
  applyLibraryContinuityDownloads,
  clearLibraryContinuityDownloads,
  getLibraryContinuityDownloads,
  type RestorableLibraryItem,
} from "@/lib/libraryDownloads";
import {
  applyToolContinuitySnapshot,
  clearToolContinuitySnapshot,
  getToolContinuitySnapshot,
  type ContinuityToolSnapshot,
} from "@/lib/toolDraftCache";
import { mergeTimestampedRecords } from "@/lib/memberContinuityMerge";

export type MemberContinuityStatus = "synced" | "pending" | "syncing" | "unavailable";

export type MemberContinuityPayload = {
  schemaVersion: 1;
  toolDrafts: ContinuityToolSnapshot["drafts"];
  toolResults: ContinuityToolSnapshot["results"];
  calculatorReports: Record<string, ContinuityCalculatorReport>;
  downloads: Record<string, RestorableLibraryItem>;
};

type MemberContinuityResponse = {
  payload: MemberContinuityPayload;
  commitment: { value: string; updatedAt: string } | null;
};

let status: MemberContinuityStatus = "synced";
const statusListeners = new Set<(next: MemberContinuityStatus) => void>();
let syncTimer: ReturnType<typeof setTimeout> | null = null;
const CONTINUITY_OWNER_KEY = "spartan_member_continuity_owner_v1";

function setStatus(next: MemberContinuityStatus) {
  status = next;
  for (const listener of statusListeners) listener(next);
}

export function getMemberContinuityStatus() {
  return status;
}

export function onMemberContinuityStatusChange(listener: (next: MemberContinuityStatus) => void) {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export async function buildMemberContinuityPayload(): Promise<MemberContinuityPayload> {
  const [tools, calculatorReports, downloads] = await Promise.all([
    getToolContinuitySnapshot(),
    getCalculatorContinuityReports(),
    getLibraryContinuityDownloads(),
  ]);
  return {
    schemaVersion: 1,
    toolDrafts: tools.drafts,
    toolResults: tools.results,
    calculatorReports,
    downloads,
  };
}

/** Per-item latest timestamp wins; repeated PUTs are safe because the merge is deterministic. */
export function mergeMemberContinuity(
  left: MemberContinuityPayload,
  right: MemberContinuityPayload,
): MemberContinuityPayload {
  return {
    schemaVersion: 1,
    toolDrafts: mergeTimestampedRecords(left.toolDrafts, right.toolDrafts),
    toolResults: mergeTimestampedRecords(left.toolResults, right.toolResults),
    calculatorReports: mergeTimestampedRecords(left.calculatorReports, right.calculatorReports),
    downloads: mergeTimestampedRecords(left.downloads, right.downloads),
  };
}

async function applyPayload(payload: MemberContinuityPayload) {
  await Promise.all([
    applyToolContinuitySnapshot({ drafts: payload.toolDrafts, results: payload.toolResults }),
    applyCalculatorContinuityReports(payload.calculatorReports),
    applyLibraryContinuityDownloads(payload.downloads),
  ]);
}

async function ensureContinuityOwner(memberId: number): Promise<void> {
  const nextOwner = String(memberId);
  const previousOwner = await AsyncStorage.getItem(CONTINUITY_OWNER_KEY);
  if (previousOwner && previousOwner !== nextOwner) {
    await Promise.all([
      clearToolContinuitySnapshot(),
      clearCalculatorContinuityReports(),
      clearLibraryContinuityDownloads(),
    ]);
  }
  await AsyncStorage.setItem(CONTINUITY_OWNER_KEY, nextOwner);
}

export async function hydrateMemberContinuity(memberId: number): Promise<void> {
  setStatus("syncing");
  try {
    await ensureContinuityOwner(memberId);
    const remote = await apiGet<MemberContinuityResponse>("/api/v1/member-continuity");
    const merged = mergeMemberContinuity(await buildMemberContinuityPayload(), remote.payload);
    await applyPayload(merged);
    if (remote.commitment) await cacheCommitment(memberId, remote.commitment.value);
    const saved = await apiPut<{ payload: MemberContinuityPayload }>("/api/v1/member-continuity", { payload: merged });
    await applyPayload(saved.payload);
    setStatus("synced");
  } catch {
    setStatus("unavailable");
  }
}

export async function syncMemberContinuity(): Promise<void> {
  setStatus("syncing");
  try {
    const saved = await apiPut<{ payload: MemberContinuityPayload }>("/api/v1/member-continuity", {
      payload: await buildMemberContinuityPayload(),
    });
    await applyPayload(saved.payload);
    setStatus("synced");
  } catch {
    setStatus("unavailable");
  }
}

export function scheduleMemberContinuitySync(): void {
  setStatus("pending");
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void syncMemberContinuity();
  }, 900);
}

export function subscribeAuthenticatedMemberContinuity(): () => void {
  return onContinuityChanged(scheduleMemberContinuitySync);
}