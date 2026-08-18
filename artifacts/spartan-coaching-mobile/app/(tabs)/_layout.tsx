import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const TAB_ICONS = {
  index: { ios: "house.fill", android: "home" },
  coach: { ios: "waveform", android: "activity" },
  tools: { ios: "wrench.and.screwdriver.fill", android: "tool" },
  learn: { ios: "books.vertical", android: "book-open" },
  account: { ios: "person.crop.circle", android: "user" },
} as const;

function TabIcon({ route, color }: { route: keyof typeof TAB_ICONS; color: string }) {
  const icon = TAB_ICONS[route];
  if (Platform.OS === "ios") {
    return <SymbolView name={icon.ios} tintColor={color} size={23} />;
  }
  return <Feather name={icon.android} size={22} color={color} />;
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.1,
        },
        tabBarItemStyle: { paddingTop: 5 },
        tabBarStyle: {
          display: "flex",
          height: 58 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 4,
          backgroundColor: colors.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderStrong,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon route="index" color={color} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          tabBarIcon: ({ color }) => <TabIcon route="coach" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarIcon: ({ color }) => <TabIcon route="tools" color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => <TabIcon route="learn" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => <TabIcon route="account" color={color} />,
        }}
      />
      <Tabs.Screen name="command" options={{ href: null }} />
      <Tabs.Screen name="contact" options={{ href: null }} />
    </Tabs>
  );
}
