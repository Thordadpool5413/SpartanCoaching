import { Feather } from "@expo/vector-icons";
import React from "react";

type TabIconName = "home" | "explore" | "my-work" | "account";

const iconNames: Record<TabIconName, React.ComponentProps<typeof Feather>["name"]> = {
  home: "home",
  explore: "grid",
  "my-work": "check-circle",
  account: "user",
};

export function TabIcon({ name, color, size }: { name: TabIconName; color: string; size: number }) {
  return <Feather name={iconNames[name]} color={color} size={size} />;
}
