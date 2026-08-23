/**
 * Account-backed continuity for non-clinical mobile work.
 *
 * Conflict policy: last clientUpdatedAt wins; equal timestamps use mutationId
 * lexical order. Pending mutations are retained locally until the server
 * acknowledges them, so network retries and duplicate delivery are safe.
 *
 * Never add raw Coach conversations, recordings, clinical/vault data, or
 * offline generation request bodies to this module.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost } from "@/lib/api";

export type MemberSyncRecordType =
  | "commitment"
  | "tool_draft"
  | "tool_result"
  | "calculator_report"
  | "library_download";

export type MemberSyncStatus = "synced" | "pending" | "unavailable";

export type MemberSyncRecord = {
  mutationId: string;
  recordType: MemberSyncRecordType;
  recordId: string;
  payload: Record<string, unknown>;
  clientUpdatedAt: string;
  isDeleted: boolean;
};

type SyncResponse = {
  records: MemberSyncRecord[];
  conflicts?: number;
  rejected?: Array<{ mutationId: string; code: string }>;
  serverTime: string;
};

const PENDING_KEY = (memberId: number) => `hsp_member_sync_pending_v1_${memberId}`;
const TOOL_DRAFT_KEY = (memberId: number, toolId: string) => `hsp_tool_draft_v1_${memberId}_${toolId}`;
const TOOL_RESULT_KEY = (memberId: number, toolId: string) => `hsp_tool_result_v1_${memberId}_${toolId}`;
const CALCULATOR_KEY = (memberId: number) => `spartan:calculator-reports:v1_${memberId}`;
const DOWNLOAD_INDEX_KEY = (memberId: number) => `spartan_library_downloads_v1_${memberId}`;
const COMMITMENT_KEY = (memberId: number) => `spartan_private_commitment_v1_${memberId}`;
const FAILED_KEY = (memberId: number) => `hsp_member_sync_failed_v1_${memberId}`;
const LEGACY_MIGRATION_OWNER_KEY = "hsp_member_sync_legacy_owner_v1";
const LEGACY_CALCULATOR_KEY = "spartan:calculator-reports:v1";
const LEGACY_DOWNLOAD_INDEX_KEY = "spartan_library_downloads_v1";
const LEGACY_TOOL_IDS = ["objection", "playbook", "weekly", "cold", "email", "research"] as const;

let activeMemberId: number | null = null;
let syncStatus: MemberSyncStatus = "synced";
const inFlightByMember = new Map<number, Promise<void>>();
const scheduledByMember = new Map<number, ReturnType<typeof setTimeout>>();
const listeners = new Set<(status: MemberSyncStatus) => void>();
let failedCount = 0;

function setStatus(status: MemberSyncStatus) {
  if (syncStatus === status) return;
  syncStatus = status;
  listeners.forEach((listener) => listener(status));
}

function mutationId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function stableLibraryRecordId(sourceUrl: string): string {
  let hash = 2166136261;
  for (let index = 0; index < sourceUrl.length; index += 1) {
    hash ^= sourceUrl.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `library:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function isNewer(incoming: MemberSyncRecord, existing: MemberSyncRecord) {
  const incomingTime = Date.parse(incoming.clientUpdatedAt);
  const existingTime = Date.parse(existing.clientUpdatedAt);
  if (incomingTime !== existingTime) return incomingTime > existingTime;
  return incoming.mutationId.localeCompare(existing.mutationId) > 0;
}

async function readPending(memberId: number): Promise<MemberSyncRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY(memberId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as MemberSyncRecord[] : [];
  } catch {
    return [];
  }
}

async function writePending(memberId: number, records: MemberSyncRecord[]) {
  await AsyncStorage.setItem(PENDING_KEY(memberId), JSON.stringify(records.slice(-100)));
}

export function getActiveSyncMemberId() {
  return activeMemberId;
}

export function setActiveSyncMember(memberId: number | null) {
  activeMemberId = memberId;
  for (const [ownerId, timer] of scheduledByMember) {
    if (ownerId !== memberId) {
      clearTimeout(timer);
      scheduledByMember.delete(ownerId);
    }
  }
  if (!memberId) {
    setStatus("unavailable");
  }
}

export function getMemberSyncStatus() {
  return syncStatus;
}

export function getMemberSyncFailureCount() {
  return failedCount;
}

function isSafeToSync(payload: Record<string, unknown>) {
  const text = JSON.stringify(payload);
  return !/\b(patient|mrn|medical\s*record|diagnosis|date\s*of\s*birth|dob|social\s*security|ssn|medicare\s*beneficiary|cancer|oncology|prognosis|medication|treatment|condition|illness|symptom|copd|heart\s+failure|hiv|diabetes|born)\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{3}-\d{2}-\d{4}\b|\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\d{8,}\b/i.test(text);
}

async function recordFailedMutation(memberId: number, mutationId: string, recordType: MemberSyncRecordType, recordId: string) {
  const raw = await AsyncStorage.getItem(FAILED_KEY(memberId));
  const failures = raw ? JSON.parse(raw) as Array<Record<string, string>> : [];
  await AsyncStorage.setItem(FAILED_KEY(memberId), JSON.stringify([
    ...failures.filter((failure) => failure.mutationId !== mutationId),
    { mutationId, recordType, recordId, reason: "This item contains sensitive information and stayed only on this device." },
  ].slice(-20)));
  failedCount = failures.length + 1;
}

export function subscribeMemberSyncStatus(listener: (status: MemberSyncStatus) => void) {
  listeners.add(listener);
  listener(syncStatus);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Store a safe local mutation. It is intentionally non-throwing so users can
 * keep working offline; an account is required before anything is uploaded.
 */
export async function queueMemberSync(
  recordType: MemberSyncRecordType,
  recordId: string,
  payload: Record<string, unknown>,
  options?: { isDeleted?: boolean; memberId?: number },
): Promise<void> {
  const memberId = options?.memberId ?? activeMemberId;
  if (!memberId || activeMemberId !== memberId) {
    setStatus("unavailable");
    return;
  }
  if (!options?.isDeleted && !isSafeToSync(payload)) {
    const localOnlyId = mutationId();
    await recordFailedMutation(memberId, localOnlyId, recordType, recordId);
    setStatus("unavailable");
    return;
  }
  const next: MemberSyncRecord = {
    mutationId: mutationId(),
    recordType,
    recordId,
    payload,
    clientUpdatedAt: new Date().toISOString(),
    isDeleted: Boolean(options?.isDeleted),
  };
  const pending = await readPending(memberId);
  if (activeMemberId !== memberId) return;
  const withoutCurrent = pending.filter(
    (item) => item.recordType !== recordType || item.recordId !== recordId,
  );
  await writePending(memberId, [...withoutCurrent, next]);
  if (activeMemberId !== memberId) return;
  setStatus("pending");
  const prior = scheduledByMember.get(memberId);
  if (prior) clearTimeout(prior);
  const timer = setTimeout(() => {
    scheduledByMember.delete(memberId);
    if (activeMemberId === memberId) void syncMemberData(memberId);
  }, 450);
  scheduledByMember.set(memberId, timer);
}

/**
 * A pre-sync version of the app stored non-clinical work in unscoped v1 keys.
 * The first authenticated member on an upgraded installation adopts it once;
 * the owner marker prevents a later sign-in from ever claiming those records.
 */
async function migrateLegacyDeviceWork(memberId: number): Promise<void> {
  if (activeMemberId !== memberId) return;
  const owner = await AsyncStorage.getItem(LEGACY_MIGRATION_OWNER_KEY);
  if (owner) return;

  for (const toolId of LEGACY_TOOL_IDS) {
    const [draft, result] = await Promise.all([
      AsyncStorage.getItem(`hsp_tool_draft_v1_${toolId}`),
      AsyncStorage.getItem(`hsp_tool_result_v1_${toolId}`),
    ]);
    if (draft) {
      await AsyncStorage.setItem(TOOL_DRAFT_KEY(memberId, toolId), draft);
      try {
        const parsed = JSON.parse(draft);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          await queueMemberSync("tool_draft", toolId, { draft: parsed as Record<string, unknown> }, { memberId });
        }
      } catch {
        // Preserve malformed local data for this signed-in owner, but never upload it.
      }
    }
    if (result) {
      await AsyncStorage.setItem(TOOL_RESULT_KEY(memberId, toolId), result);
      await queueMemberSync("tool_result", toolId, { result }, { memberId });
    }
  }

  const legacyReports = await AsyncStorage.getItem(LEGACY_CALCULATOR_KEY);
  if (legacyReports) {
    await AsyncStorage.setItem(CALCULATOR_KEY(memberId), legacyReports);
    try {
      const reports = JSON.parse(legacyReports);
      if (Array.isArray(reports)) {
        for (const report of reports) {
          if (report && typeof report === "object" && typeof report.id === "string") {
            await queueMemberSync("calculator_report", `calc:${report.id}`, report as Record<string, unknown>, { memberId });
          }
        }
      }
    } catch {
      // The local copy remains available to its adopted owner.
    }
  }

  const legacyDownloads = await AsyncStorage.getItem(LEGACY_DOWNLOAD_INDEX_KEY);
  if (legacyDownloads) {
    await AsyncStorage.setItem(DOWNLOAD_INDEX_KEY(memberId), legacyDownloads);
    try {
      const downloads = JSON.parse(legacyDownloads) as Record<string, Record<string, unknown>>;
      for (const [sourceUrl, item] of Object.entries(downloads || {})) {
        if (typeof item?.title !== "string" || (item.kind !== "article" && item.kind !== "audio" && item.kind !== "resource")) continue;
        await queueMemberSync("library_download", stableLibraryRecordId(sourceUrl), {
          sourceUrl,
          title: item.title,
          kind: item.kind,
          description: typeof item.description === "string" ? item.description : "",
          downloadedAt: typeof item.downloadedAt === "string" ? item.downloadedAt : new Date().toISOString(),
        }, { memberId });
      }
    } catch {
      // Download metadata stays local if a legacy index is malformed.
    }
  }

  if (activeMemberId === memberId) {
    await AsyncStorage.setItem(LEGACY_MIGRATION_OWNER_KEY, String(memberId));
  }
}

async function applyRemoteRecord(memberId: number, record: MemberSyncRecord): Promise<void> {
  if (record.recordType === "commitment") {
    if (record.isDeleted) await AsyncStorage.removeItem(COMMITMENT_KEY(memberId));
    else await AsyncStorage.setItem(COMMITMENT_KEY(memberId), String(record.payload.value || ""));
    return;
  }
  if (record.recordType === "tool_draft") {
    if (record.isDeleted) await AsyncStorage.removeItem(TOOL_DRAFT_KEY(memberId, record.recordId));
    else await AsyncStorage.setItem(TOOL_DRAFT_KEY(memberId, record.recordId), JSON.stringify(record.payload.draft || {}));
    return;
  }
  if (record.recordType === "tool_result") {
    if (record.isDeleted) await AsyncStorage.removeItem(TOOL_RESULT_KEY(memberId, record.recordId));
    else await AsyncStorage.setItem(TOOL_RESULT_KEY(memberId, record.recordId), String(record.payload.result || ""));
    return;
  }
  if (record.recordType === "calculator_report") {
    const raw = await AsyncStorage.getItem(CALCULATOR_KEY(memberId));
    const current = raw ? JSON.parse(raw) as Array<Record<string, unknown>> : [];
    const reportId = typeof record.payload.id === "string"
      ? record.payload.id
      : record.recordId.replace(/^calc:/, "");
    const withoutCurrent = current.filter((item) => item.id !== reportId);
    const next = record.isDeleted ? withoutCurrent : [{ ...record.payload, id: reportId }, ...withoutCurrent];
    await AsyncStorage.setItem(CALCULATOR_KEY(memberId), JSON.stringify(next.slice(0, 24)));
    return;
  }
  if (record.recordType === "library_download") {
    const raw = await AsyncStorage.getItem(DOWNLOAD_INDEX_KEY(memberId));
    const index = raw ? JSON.parse(raw) as Record<string, Record<string, unknown>> : {};
    const sourceUrl = typeof record.payload.sourceUrl === "string"
      ? record.payload.sourceUrl
      : Object.entries(index).find(([, item]) => item.syncRecordId === record.recordId)?.[0];
    if (record.isDeleted) {
      if (sourceUrl) delete index[sourceUrl];
    } else {
      // Keep a real offline file on this device, but restored metadata must
      // never pretend a removed local file is available offline.
      if (!sourceUrl) return;
      const existing = index[sourceUrl];
      index[sourceUrl] = {
        ...record.payload,
        sourceUrl,
        syncRecordId: record.recordId,
        ...(existing?.localUri || existing?.content ? existing : { availability: "unavailable" }),
      };
    }
    await AsyncStorage.setItem(DOWNLOAD_INDEX_KEY(memberId), JSON.stringify(index));
  }
}

async function applyRecordsUnlessLocalWins(memberId: number, records: MemberSyncRecord[], pending: MemberSyncRecord[]) {
  for (const record of records) {
    const local = pending.find(
      (item) => item.recordType === record.recordType && item.recordId === record.recordId,
    );
    if (local && isNewer(local, record)) continue;
    await applyRemoteRecord(memberId, record);
  }
}

/**
 * Restore account records then flush pending work. Repeated calls share one
 * in-flight request, and acknowledged mutations are removed only after the
 * server returns its authoritative records.
 */
export async function syncMemberData(memberId: number): Promise<void> {
  if (activeMemberId !== memberId) return;
  const existingFlight = inFlightByMember.get(memberId);
  if (existingFlight) return existingFlight;
  const flight = (async () => {
    await migrateLegacyDeviceWork(memberId);
    if (activeMemberId !== memberId) return;
    const pending = await readPending(memberId);
    if (activeMemberId !== memberId) return;
    if (pending.length) setStatus("pending");
    try {
      const remote = await apiGet<SyncResponse>("/api/v1/member-sync");
      if (activeMemberId !== memberId) return;
      await applyRecordsUnlessLocalWins(memberId, remote.records, pending);
      if (!pending.length) {
        if (activeMemberId === memberId) setStatus("synced");
        return;
      }
      const committed = await apiPost<SyncResponse>("/api/v1/member-sync", { mutations: pending });
      if (activeMemberId !== memberId) return;
      const afterRequest = await readPending(memberId);
      const acknowledged = new Set(pending.map((record) => record.mutationId));
      for (const rejected of committed.rejected || []) {
        const failed = pending.find((record) => record.mutationId === rejected.mutationId);
        if (failed) await recordFailedMutation(memberId, failed.mutationId, failed.recordType, failed.recordId);
      }
      for (const rejected of committed.rejected || []) acknowledged.add(rejected.mutationId);
      const remaining = afterRequest.filter((record) => !acknowledged.has(record.mutationId));
      await applyRecordsUnlessLocalWins(memberId, committed.records, remaining);
      await writePending(memberId, remaining);
      if (activeMemberId === memberId) setStatus(remaining.length ? "pending" : "synced");
    } catch {
      // Local work remains queued. UI says unavailable rather than promising
      // that a device-only write is already durable in the account.
      if (activeMemberId === memberId) setStatus("unavailable");
    }
  })().finally(() => {
    inFlightByMember.delete(memberId);
  });
  inFlightByMember.set(memberId, flight);
  return flight;
}