import { Feather } from "@expo/vector-icons";
import React from "react";

type TabIconName = "home" | "command" | "coach" | "explore" | "resources" | "my-work" | "account";

const iconNames: Record<TabIconName, React.ComponentProps<typeof Feather>["name"]> = {
  home: "home",
  command: "target",
  coach: "message-circle",
  explore: "grid",
  resources: "book-open",
  "my-work": "check-circle",
  account: "user",
};

export function TabIcon({ name, color, size }: { name: TabIconName; color: string; size: number }) {
  return <Feather name={iconNames[name]} color={color} size={size} />;
}
