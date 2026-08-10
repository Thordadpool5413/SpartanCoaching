import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiDelete, apiGet, apiPut } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export type ToolType = "objection" | "playbook" | "email" | "roleplay";

export interface SavedResponse {
  id: string;
  toolType: ToolType;
  title: string;
  response: string;
  savedAt: number;
  /** Server optimistic-concurrency version (0 = not yet on server) */
  version?: number;
}

const STORAGE_KEY = "spartan_saved_responses";
const MAX_PER_TOOL_TYPE = 20;
const KIND = "saved_response";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type ServerWorkspaceItem = {
  clientKey: string;
  title: string | null;
  payload: { toolType?: string; response?: string; title?: string };
  version: number;
  clientUpdatedAtMs: number;
};

function fromServer(item: ServerWorkspaceItem): SavedResponse | null {
  const toolType = item.payload?.toolType as ToolType | undefined;
  const response = item.payload?.response;
  if (!toolType || typeof response !== "string") return null;
  return {
    id: item.clientKey,
    toolType,
    title: item.title || item.payload?.title || "Saved",
    response,
    savedAt: item.clientUpdatedAtMs || Date.now(),
    version: item.version,
  };
}

async function readLocalAll(): Promise<SavedResponse[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const all: SavedResponse[] = raw ? JSON.parse(raw) : [];
    return Array.isArray(all) ? all : [];
  } catch {
    return [];
  }
}

async function writeLocalAll(all: SavedResponse[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/**
 * Saved AI results: local AsyncStorage is cache/offline only.
 * When signed in with field-kit access, server /api/workspace/items is authoritative.
 * PUT uses baseVersion so newer server work is never silently overwritten.
 */
export function useSavedResponses(toolType: ToolType) {
  const { isAuthenticated, canUseFieldKit } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      let all = await readLocalAll();

      if (isAuthenticated && canUseFieldKit) {
        try {
          const remote = await apiGet<{ items: ServerWorkspaceItem[] }>(
            `/api/workspace/items?kind=${KIND}`,
          );
          const fromRemote = (remote.items || [])
            .map(fromServer)
            .filter((x): x is SavedResponse => Boolean(x));

          // Merge by id: prefer higher version (server wins on equal version if newer)
          const map = new Map<string, SavedResponse>();
          for (const item of all) map.set(item.id, item);
          for (const item of fromRemote) {
            const existing = map.get(item.id);
            if (
              !existing ||
              (item.version ?? 0) > (existing.version ?? 0) ||
              ((item.version ?? 0) === (existing.version ?? 0) &&
                item.savedAt >= existing.savedAt)
            ) {
              map.set(item.id, item);
            }
          }
          all = [...map.values()];
          await writeLocalAll(all);

          // Push local-only (version 0 / missing on server) upward
          for (const local of all) {
            if ((local.version ?? 0) > 0) continue;
            try {
              const res = await apiPut<{ item: ServerWorkspaceItem }>(
                `/api/workspace/items/${encodeURIComponent(local.id)}`,
                {
                  kind: KIND,
                  title: local.title,
                  payload: {
                    toolType: local.toolType,
                    response: local.response,
                    title: local.title,
                  },
                  baseVersion: 0,
                  clientUpdatedAtMs: local.savedAt,
                },
              );
              local.version = res.item.version;
            } catch {
              // stay local until next sync
            }
          }
          await writeLocalAll(all);
        } catch {
          // Offline / 401: keep local cache only
        }
      }

      setSavedItems(all.filter((item) => item.toolType === toolType));
    } catch {
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  }, [toolType, isAuthenticated, canUseFieldKit]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveResponse = useCallback(
    async (title: string, response: string): Promise<void> => {
      try {
        const all = await readLocalAll();
        const newItem: SavedResponse = {
          id: generateId(),
          toolType,
          title,
          response,
          savedAt: Date.now(),
          version: 0,
        };
        const withNew = [newItem, ...all];
        const forThisType = withNew.filter((item) => item.toolType === toolType);
        const evicted =
          forThisType.length > MAX_PER_TOOL_TYPE
            ? new Set(
                forThisType
                  .slice()
                  .sort((a, b) => a.savedAt - b.savedAt)
                  .slice(0, forThisType.length - MAX_PER_TOOL_TYPE)
                  .map((item) => item.id),
              )
            : null;
        let updated = evicted
          ? withNew.filter((item) => !evicted.has(item.id))
          : withNew;

        if (isAuthenticated && canUseFieldKit) {
          try {
            const res = await apiPut<{ item: ServerWorkspaceItem }>(
              `/api/workspace/items/${encodeURIComponent(newItem.id)}`,
              {
                kind: KIND,
                title: newItem.title,
                payload: {
                  toolType: newItem.toolType,
                  response: newItem.response,
                  title: newItem.title,
                },
                baseVersion: 0,
                clientUpdatedAtMs: newItem.savedAt,
              },
            );
            newItem.version = res.item.version;
            updated = updated.map((i) => (i.id === newItem.id ? newItem : i));
          } catch (e) {
            // Keep local; will push on next load if online
            if (e instanceof ApiError && e.status === 409) {
              // Should not happen on create; refresh
              await loadAll();
              return;
            }
          }
        }

        await writeLocalAll(updated);
        setSavedItems(updated.filter((item) => item.toolType === toolType));
      } catch {
        // ignore
      }
    },
    [toolType, isAuthenticated, canUseFieldKit, loadAll],
  );

  const deleteResponse = useCallback(
    async (id: string): Promise<void> => {
      try {
        const all = await readLocalAll();
        const target = all.find((item) => item.id === id);
        const updated = all.filter((item) => item.id !== id);
        await writeLocalAll(updated);
        setSavedItems(updated.filter((item) => item.toolType === toolType));

        if (
          isAuthenticated &&
          canUseFieldKit &&
          target &&
          (target.version ?? 0) > 0
        ) {
          try {
            await apiDelete(
              `/api/workspace/items/${encodeURIComponent(id)}?kind=${KIND}&baseVersion=${target.version}`,
            );
          } catch (e) {
            if (e instanceof ApiError && e.status === 409) {
              await loadAll();
            }
          }
        }
      } catch {
        // ignore
      }
    },
    [toolType, isAuthenticated, canUseFieldKit, loadAll],
  );

  return { savedItems, loading, saveResponse, deleteResponse, reload: loadAll };
}
