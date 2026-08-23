import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { getSessionToken } from "@/lib/api";
import { getActiveSyncMemberId, queueMemberSync } from "@/lib/memberSync";
import { markContinuityChanged } from "@/lib/continuityEvents";

const indexKeyForMember = (memberId: number | null) => {
  return memberId ? `spartan_library_downloads_v1_${memberId}` : "spartan_library_downloads_v1";
};
const INDEX_KEY = () => indexKeyForMember(getActiveSyncMemberId());
const DIRECTORY_NAME = "spartan-library";

export type DownloadedLibraryItem = {
  sourceUrl: string;
  localUri?: string;
  title: string;
  kind: "article" | "audio" | "resource";
  description?: string;
  content?: string;
  downloadedAt: string;
  /** Restored account metadata is not a local file until re-downloaded. */
  availability?: "local" | "unavailable";
  syncRecordId?: string;
};
export type RestorableLibraryItem = Pick<DownloadedLibraryItem, "sourceUrl" | "title" | "kind" | "description" | "downloadedAt"> & { updatedAt: string };

function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function syncRecordId(sourceUrl: string): string {
  return `library:${stableId(sourceUrl)}`;
}

export function libraryDownloadFilename(sourceUrl: string, kind: DownloadedLibraryItem["kind"]): string {
  let extension = kind === "audio" ? "mp3" : kind === "article" ? "html" : "bin";
  try {
    const path = new URL(sourceUrl).pathname;
    const match = path.match(/\.([a-z0-9]{2,5})$/i);
    if (match) extension = match[1].toLowerCase();
  } catch {
    // Keep the safe kind based extension.
  }
  return `${stableId(sourceUrl)}.${extension}`;
}

async function readIndex(memberId = getActiveSyncMemberId()): Promise<Record<string, DownloadedLibraryItem>> {
  try {
    const raw = await AsyncStorage.getItem(indexKeyForMember(memberId));
    return raw ? JSON.parse(raw) as Record<string, DownloadedLibraryItem> : {};
  } catch {
    return {};
  }
}

async function writeIndex(value: Record<string, DownloadedLibraryItem>, memberId = getActiveSyncMemberId()): Promise<void> {
  await AsyncStorage.setItem(indexKeyForMember(memberId), JSON.stringify(value));
}

async function directoryUri(): Promise<string> {
  if (!FileSystem.documentDirectory) throw new Error("Secure app storage is unavailable.");
  const uri = `${FileSystem.documentDirectory}${DIRECTORY_NAME}/`;
  await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  return uri;
}

export async function getDownloadedLibraryItem(sourceUrl: string): Promise<DownloadedLibraryItem | null> {
  if (Platform.OS === "web") return null;
  const index = await readIndex();
  const item = index[sourceUrl];
  if (!item) return null;
  if (item.availability === "unavailable") return item;
  if (item.content) return item;
  if (!item.localUri) {
    delete index[sourceUrl];
    await writeIndex(index);
    return null;
  }
  const info = await FileSystem.getInfoAsync(item.localUri);
  if (info.exists) return item;
  delete index[sourceUrl];
  await writeIndex(index);
  return null;
}

export async function listDownloadedLibraryItems(): Promise<DownloadedLibraryItem[]> {
  if (Platform.OS === "web") return [];
  const index = await readIndex();
  const current: DownloadedLibraryItem[] = [];
  let changed = false;

  for (const [sourceUrl, item] of Object.entries(index)) {
    if (item.content) {
      current.push(item);
      continue;
    }
    if (item.availability === "unavailable") {
      current.push(item);
      continue;
    }
    const info = item.localUri ? await FileSystem.getInfoAsync(item.localUri) : { exists: false };
    if (info.exists) current.push(item);
    else {
      delete index[sourceUrl];
      changed = true;
    }
  }

  if (changed) await writeIndex(index);
  return current.sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt));
}

export async function getLibraryContinuityDownloads(): Promise<Record<string, RestorableLibraryItem>> {
  const index = await readIndex();
  return Object.fromEntries(Object.values(index).map((item) => [item.sourceUrl, {
    sourceUrl: item.sourceUrl, title: item.title, kind: item.kind, description: item.description, downloadedAt: item.downloadedAt, updatedAt: item.downloadedAt,
  }]));
}

export async function applyLibraryContinuityDownloads(items: Record<string, RestorableLibraryItem>) {
  const index = await readIndex();
  for (const item of Object.values(items)) {
    if (!index[item.sourceUrl]) {
      const { updatedAt: _updatedAt, ...download } = item;
      index[item.sourceUrl] = { ...download, availability: "unavailable", syncRecordId: syncRecordId(item.sourceUrl) };
    }
  }
  await writeIndex(index);
}

export async function clearLibraryContinuityDownloads() {
  await AsyncStorage.removeItem(INDEX_KEY());
}

export async function saveTextLibraryItem(input: {
  sourceUrl: string;
  title: string;
  description?: string;
  content: string;
}): Promise<DownloadedLibraryItem> {
  if (Platform.OS === "web") throw new Error("Downloads are available in the iPhone app.");
  const item: DownloadedLibraryItem = {
    sourceUrl: input.sourceUrl,
    title: input.title,
    kind: "article",
    description: input.description,
    content: input.content,
    downloadedAt: new Date().toISOString(),
    availability: "local",
    syncRecordId: syncRecordId(input.sourceUrl),
  };
  const memberId = getActiveSyncMemberId();
  const index = await readIndex(memberId);
  index[input.sourceUrl] = item;
  await writeIndex(index, memberId);
  if (memberId) await queueMemberSync("library_download", item.syncRecordId!, {
    sourceUrl: item.sourceUrl,
    title: item.title,
    kind: item.kind,
    description: item.description || "",
    downloadedAt: item.downloadedAt,
  }, { memberId });
  markContinuityChanged();
  return item;
}

export async function downloadLibraryItem(input: {
  sourceUrl: string;
  title: string;
  kind: DownloadedLibraryItem["kind"];
}): Promise<DownloadedLibraryItem> {
  if (Platform.OS === "web") throw new Error("Downloads are available in the iPhone app.");
  const directory = await directoryUri();
  const localUri = `${directory}${libraryDownloadFilename(input.sourceUrl, input.kind)}`;
  const token = await getSessionToken();
  const result = await FileSystem.downloadAsync(input.sourceUrl, localUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (result.status < 200 || result.status >= 300) {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
    throw new Error("The publisher did not provide a downloadable file.");
  }
  const item: DownloadedLibraryItem = {
    ...input,
    localUri,
    downloadedAt: new Date().toISOString(),
    availability: "local",
    syncRecordId: syncRecordId(input.sourceUrl),
  };
  const memberId = getActiveSyncMemberId();
  const index = await readIndex(memberId);
  index[input.sourceUrl] = item;
  await writeIndex(index, memberId);
  if (memberId) await queueMemberSync("library_download", item.syncRecordId!, {
    sourceUrl: item.sourceUrl,
    title: item.title,
    kind: item.kind,
    description: item.description || "",
    downloadedAt: item.downloadedAt,
  }, { memberId });
  markContinuityChanged();
  return item;
}

export async function removeDownloadedLibraryItem(sourceUrl: string): Promise<void> {
  if (Platform.OS === "web") return;
  const memberId = getActiveSyncMemberId();
  const index = await readIndex(memberId);
  const item = index[sourceUrl];
  if (item?.localUri) await FileSystem.deleteAsync(item.localUri, { idempotent: true });
  delete index[sourceUrl];
  await writeIndex(index, memberId);
  if (memberId) await queueMemberSync(
    "library_download",
    item?.syncRecordId || syncRecordId(sourceUrl),
    {},
    { isDeleted: true, memberId },
  );
  markContinuityChanged();
}
