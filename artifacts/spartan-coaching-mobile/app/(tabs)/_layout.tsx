import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { TabIcon } from "@/components/ui/TabIcon";

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
        tabBarItemStyle: { paddingTop: 5, minHeight: 44 },
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
          tabBarAccessibilityLabel: "Home",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="command"
        options={{
          title: "Command",
          tabBarAccessibilityLabel: "Command",
          tabBarIcon: ({ color }) => <TabIcon name="command" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarAccessibilityLabel: "Tools",
          tabBarIcon: ({ color }) => <TabIcon name="explore" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Resources",
          tabBarAccessibilityLabel: "Resources",
          tabBarIcon: ({ color }) => <TabIcon name="resources" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="my-work"
        options={{
          title: "My Work",
          tabBarAccessibilityLabel: "My Work",
          tabBarIcon: ({ color }) => <TabIcon name="my-work" color={color} size={24} />,
        }}
      />
      <Tabs.Screen name="coach" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
      <Tabs.Screen name="contact" options={{ href: null }} />
    </Tabs>
  );
}
