import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { SAVED_RESPONSES_STORAGE_KEY } from "@/lib/savedResponsesCache";

export type ToolType = "objection" | "playbook" | "email" | "roleplay";

export interface SavedResponse {
  id: string;
  toolType: ToolType;
  title: string;
  response: string;
  savedAt: number;
  version?: number;
}

export { clearSavedResponsesCache } from "@/lib/savedResponsesCache";

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

function serverFromConflictBody(body: unknown): SavedResponse | null {
  if (!body || typeof body !== "object") return null;
  const server = (body as { server?: ServerWorkspaceItem }).server;
  if (!server) return null;
  return fromServer(server);
}

function readLocalAll(): SavedResponse[] {
  try {
    const raw = localStorage.getItem(SAVED_RESPONSES_STORAGE_KEY);
    const all: SavedResponse[] = raw ? JSON.parse(raw) : [];
    return Array.isArray(all) ? all : [];
  } catch {
    return [];
  }
}

function writeLocalAll(all: SavedResponse[]): void {
  localStorage.setItem(SAVED_RESPONSES_STORAGE_KEY, JSON.stringify(all));
}

function mergeByVersion(
  local: SavedResponse[],
  remote: SavedResponse[],
): SavedResponse[] {
  const map = new Map<string, SavedResponse>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
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
  return [...map.values()];
}

/**
 * Web saved AI results — same server contract as iOS.
 * localStorage is cache only; /api/workspace/items is authoritative when entitled.
 */
export function useSavedResponses(toolType: ToolType) {
  const { isAuthenticated, canUseFieldKit } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      let all = readLocalAll();

      if (isAuthenticated && canUseFieldKit) {
        try {
          const res = await fetch(`/api/workspace/items?kind=${KIND}`, {
            credentials: "include",
          });
          if (res.ok) {
            const remote = (await res.json()) as { items?: ServerWorkspaceItem[] };
            const fromRemote = (remote.items || [])
              .map(fromServer)
              .filter((x): x is SavedResponse => Boolean(x));
            all = mergeByVersion(all, fromRemote);
            writeLocalAll(all);

            for (const local of all) {
              if ((local.version ?? 0) > 0) continue;
              try {
                const put = await fetch(
                  `/api/workspace/items/${encodeURIComponent(local.id)}`,
                  {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      kind: KIND,
                      title: local.title,
                      payload: {
                        toolType: local.toolType,
                        response: local.response,
                        title: local.title,
                      },
                      baseVersion: 0,
                      clientUpdatedAtMs: local.savedAt,
                    }),
                  },
                );
                if (put.ok) {
                  const data = (await put.json()) as { item: ServerWorkspaceItem };
                  local.version = data.item.version;
                } else if (put.status === 409) {
                  const data = await put.json().catch(() => ({}));
                  const serverItem = serverFromConflictBody(data);
                  if (serverItem) {
                    all = all.map((i) => (i.id === local.id ? serverItem : i));
                  }
                }
              } catch {
                // stay local
              }
            }
            writeLocalAll(all);
          }
        } catch {
          // offline
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
    void loadAll();
  }, [loadAll]);

  const saveResponse = useCallback(
    async (title: string, response: string): Promise<void> => {
      try {
        const all = readLocalAll();
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
            const put = await fetch(
              `/api/workspace/items/${encodeURIComponent(newItem.id)}`,
              {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  kind: KIND,
                  title: newItem.title,
                  payload: {
                    toolType: newItem.toolType,
                    response: newItem.response,
                    title: newItem.title,
                  },
                  baseVersion: 0,
                  clientUpdatedAtMs: newItem.savedAt,
                }),
              },
            );
            if (put.ok) {
              const data = (await put.json()) as { item: ServerWorkspaceItem };
              newItem.version = data.item.version;
              updated = updated.map((i) => (i.id === newItem.id ? newItem : i));
            } else if (put.status === 409) {
              const data = await put.json().catch(() => ({}));
              const serverItem = serverFromConflictBody(data);
              if (serverItem) {
                updated = updated.map((i) =>
                  i.id === newItem.id ? serverItem : i,
                );
              }
            }
          } catch {
            // keep local
          }
        }

        writeLocalAll(updated);
        setSavedItems(updated.filter((item) => item.toolType === toolType));
      } catch {
        // ignore
      }
    },
    [toolType, isAuthenticated, canUseFieldKit],
  );

  const deleteResponse = useCallback(
    async (id: string): Promise<void> => {
      try {
        const all = readLocalAll();
        const target = all.find((item) => item.id === id);
        let updated = all.filter((item) => item.id !== id);
        writeLocalAll(updated);
        setSavedItems(updated.filter((item) => item.toolType === toolType));

        if (
          isAuthenticated &&
          canUseFieldKit &&
          target &&
          (target.version ?? 0) > 0
        ) {
          try {
            const del = await fetch(
              `/api/workspace/items/${encodeURIComponent(id)}?kind=${KIND}&baseVersion=${target.version}`,
              { method: "DELETE", credentials: "include" },
            );
            if (del.status === 409) {
              const data = await del.json().catch(() => ({}));
              const serverItem = serverFromConflictBody(data);
              if (serverItem) {
                updated = [...updated, serverItem];
                writeLocalAll(updated);
                setSavedItems(
                  updated.filter((item) => item.toolType === toolType),
                );
              } else {
                await loadAll();
              }
            }
          } catch {
            // ignore
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
