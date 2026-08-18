import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { getSessionToken } from "@/lib/api";

const INDEX_KEY = "spartan_library_downloads_v1";
const DIRECTORY_NAME = "spartan-library";

export type DownloadedLibraryItem = {
  sourceUrl: string;
  localUri: string;
  title: string;
  kind: "article" | "audio" | "resource";
  downloadedAt: string;
};

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
  const info = await FileSystem.getInfoAsync(item.localUri);
  if (info.exists) return item;
  delete index[sourceUrl];
  await writeIndex(index);
  return null;
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
  return item;
}

export async function removeDownloadedLibraryItem(sourceUrl: string): Promise<void> {
  if (Platform.OS === "web") return;
  const index = await readIndex();
  const item = index[sourceUrl];
  if (item) await FileSystem.deleteAsync(item.localUri, { idempotent: true });
  delete index[sourceUrl];
  await writeIndex(index);
}
