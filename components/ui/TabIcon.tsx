import React from "react";
import { View } from "react-native";
import { Svg, Path, Circle, Rect } from "react-native-svg";

type TabIconName = "home" | "explore" | "my-work" | "account";

type Props = {
  name: TabIconName;
  color: string;
  size?: number;
  focused?: boolean;
};

function HomeIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H15v-6H9v6H4a1 1 0 01-1-1V10.5z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExploreIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7.5" height="7.5" rx="2" stroke={color} strokeWidth={1.75} />
      <Rect x="13.5" y="3" width="7.5" height="7.5" rx="2" stroke={color} strokeWidth={1.75} />
      <Rect x="3" y="13.5" width="7.5" height="7.5" rx="2" stroke={color} strokeWidth={1.75} />
      <Rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" stroke={color} strokeWidth={1.75} />
    </Svg>
  );
}

function MyWorkIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.75} />
      <Path
        d="M8.5 12l2.5 2.5 5-5"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AccountIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.75} />
      <Path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TabIcon({ name, color, size = 24, focused }: Props) {
  const iconSize = size;
  switch (name) {
    case "home": return <HomeIcon color={color} size={iconSize} />;
    case "explore": return <ExploreIcon color={color} size={iconSize} />;
    case "my-work": return <MyWorkIcon color={color} size={iconSize} />;
    case "account": return <AccountIcon color={color} size={iconSize} />;
    default: return <View />;
  }
}
