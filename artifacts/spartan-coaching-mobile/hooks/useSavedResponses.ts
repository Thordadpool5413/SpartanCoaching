import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type ToolType = "objection" | "playbook" | "email";

export interface SavedResponse {
  id: string;
  toolType: ToolType;
  title: string;
  response: string;
  savedAt: number;
}

const STORAGE_KEY = "spartan_saved_responses";
const MAX_PER_TOOL_TYPE = 20;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useSavedResponses(toolType: ToolType) {
  const [savedItems, setSavedItems] = useState<SavedResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const all: SavedResponse[] = raw ? JSON.parse(raw) : [];
      setSavedItems(all.filter((item) => item.toolType === toolType));
    } catch {
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  }, [toolType]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveResponse = useCallback(
    async (title: string, response: string): Promise<void> => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const all: SavedResponse[] = raw ? JSON.parse(raw) : [];
        const newItem: SavedResponse = {
          id: generateId(),
          toolType,
          title,
          response,
          savedAt: Date.now(),
        };
        const withNew = [newItem, ...all];
        const forThisType = withNew.filter((item) => item.toolType === toolType);
        const evicted = forThisType.length > MAX_PER_TOOL_TYPE
          ? new Set(
              forThisType
                .slice()
                .sort((a, b) => a.savedAt - b.savedAt)
                .slice(0, forThisType.length - MAX_PER_TOOL_TYPE)
                .map((item) => item.id)
            )
          : null;
        const updated = evicted
          ? withNew.filter((item) => !evicted.has(item.id))
          : withNew;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSavedItems(updated.filter((item) => item.toolType === toolType));
      } catch {
      }
    },
    [toolType]
  );

  const deleteResponse = useCallback(
    async (id: string): Promise<void> => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const all: SavedResponse[] = raw ? JSON.parse(raw) : [];
        const updated = all.filter((item) => item.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSavedItems(updated.filter((item) => item.toolType === toolType));
      } catch {
      }
    },
    [toolType]
  );

  return { savedItems, loading, saveResponse, deleteResponse };
}
