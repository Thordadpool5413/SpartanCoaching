import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { getSessionToken } from "@/lib/api";
import { markContinuityChanged } from "@/lib/continuityEvents";

const INDEX_KEY = "spartan_library_downloads_v1";
const RESTORABLE_INDEX_KEY = "spartan_library_restore_metadata_v1";
const DIRECTORY_NAME = "spartan-library";

export type DownloadedLibraryItem = {
  sourceUrl: string;
  localUri?: string;
  title: string;
  kind: "article" | "audio" | "resource";
  description?: string;
  content?: string;
  downloadedAt: string;
};

export type RestorableLibraryItem = Pick<
  DownloadedLibraryItem,
  "sourceUrl" | "title" | "kind" | "description"
> & { updatedAt: string };

function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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

async function readIndex(): Promise<Record<string, DownloadedLibraryItem>> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) as Record<string, DownloadedLibraryItem> : {};
  } catch {
    return {};
  }
}

async function writeIndex(value: Record<string, DownloadedLibraryItem>): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(value));
}

async function readRestorableIndex(): Promise<Record<string, RestorableLibraryItem>> {
  try {
    const raw = await AsyncStorage.getItem(RESTORABLE_INDEX_KEY);
    return raw ? JSON.parse(raw) as Record<string, RestorableLibraryItem> : {};
  } catch {
    return {};
  }
}

export async function listRestorableLibraryItems(): Promise<RestorableLibraryItem[]> {
  const items = await readRestorableIndex();
  return Object.values(items).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getLibraryContinuityDownloads(): Promise<Record<string, RestorableLibraryItem>> {
  const [saved, restored] = await Promise.all([listDownloadedLibraryItems(), readRestorableIndex()]);
  const local = Object.fromEntries(saved.map((item) => [item.sourceUrl, {
    sourceUrl: item.sourceUrl,
    title: item.title,
    kind: item.kind,
    description: item.description,
    updatedAt: item.downloadedAt,
  }]));
  return { ...restored, ...local };
}

export async function applyLibraryContinuityDownloads(
  remoteDownloads: Record<string, RestorableLibraryItem>,
): Promise<void> {
  const local = await getLibraryContinuityDownloads();
  const merged: Record<string, RestorableLibraryItem> = {};
  for (const sourceUrl of new Set([...Object.keys(local), ...Object.keys(remoteDownloads)])) {
    const localItem = local[sourceUrl];
    const remoteItem = remoteDownloads[sourceUrl];
    merged[sourceUrl] = !localItem || (remoteItem && Date.parse(remoteItem.updatedAt) > Date.parse(localItem.updatedAt))
      ? remoteItem!
      : localItem;
  }
  await AsyncStorage.setItem(RESTORABLE_INDEX_KEY, JSON.stringify(merged));
}

export async function clearLibraryContinuityDownloads(): Promise<void> {
  const index = await readIndex();
  for (const item of Object.values(index)) {
    if (item.localUri) await FileSystem.deleteAsync(item.localUri, { idempotent: true }).catch(() => undefined);
  }
  await AsyncStorage.multiRemove([INDEX_KEY, RESTORABLE_INDEX_KEY]);
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
  };
  const index = await readIndex();
  index[input.sourceUrl] = item;
  await writeIndex(index);
  const restored = await readRestorableIndex();
  delete restored[input.sourceUrl];
  await AsyncStorage.setItem(RESTORABLE_INDEX_KEY, JSON.stringify(restored));
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
  };
  const index = await readIndex();
  index[input.sourceUrl] = item;
  await writeIndex(index);
  const restored = await readRestorableIndex();
  delete restored[input.sourceUrl];
  await AsyncStorage.setItem(RESTORABLE_INDEX_KEY, JSON.stringify(restored));
  markContinuityChanged();
  return item;
}

export async function removeDownloadedLibraryItem(sourceUrl: string): Promise<void> {
  if (Platform.OS === "web") return;
  const index = await readIndex();
  const item = index[sourceUrl];
  if (item?.localUri) await FileSystem.deleteAsync(item.localUri, { idempotent: true });
  delete index[sourceUrl];
  await writeIndex(index);
  const restored = await readRestorableIndex();
  delete restored[sourceUrl];
  await AsyncStorage.setItem(RESTORABLE_INDEX_KEY, JSON.stringify(restored));
  markContinuityChanged();
}
