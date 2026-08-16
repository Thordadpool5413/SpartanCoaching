import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { tabBarBlurIntensity, tabBarBlurTint } from "@/lib/iosProductQuality";

const TAB_ICONS = {
  index: { ios: "calendar", android: "calendar" },
  coach: { ios: "waveform", android: "activity" },
  tools: { ios: "scope", android: "target" },
  learn: { ios: "books.vertical", android: "book-open" },
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
  const scheme = useColorScheme();
  const { reduceTransparency } = useAccessibilityPrefs();
  const isIOS = Platform.OS === "ios";
  const useBlur = isIOS && !reduceTransparency;

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
        tabBarItemStyle: { paddingTop: 4 },
        tabBarStyle: {
          height: 52 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 3,
          backgroundColor: useBlur ? "transparent" : colors.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
        },
        tabBarBackground: () =>
          useBlur ? (
            <BlurView
              intensity={tabBarBlurIntensity(false, 76)}
              tint={tabBarBlurTint(scheme)}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBar }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
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
          title: "Practice",
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
      <Tabs.Screen name="command" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
      <Tabs.Screen name="contact" options={{ href: null }} />
    </Tabs>
  );
}
