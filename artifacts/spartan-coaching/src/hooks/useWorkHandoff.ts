import { useEffect, useState } from "react";
import { loadMemberWorkItem, type MemberWorkItem } from "@/lib/memberWorkClient";

export function workHandoffText(item: MemberWorkItem | null) {
  if (!item) return "";
  return typeof item.output.text === "string" ? item.output.text : JSON.stringify(item.output, null, 2);
}

export function useWorkHandoff() {
  const [item, setItem] = useState<MemberWorkItem | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("work");
    if (id) void loadMemberWorkItem(id).then(setItem).catch((cause) => setError(cause instanceof Error ? cause.message : "Saved context could not be loaded."));
  }, []);
  return { item, error };
}
