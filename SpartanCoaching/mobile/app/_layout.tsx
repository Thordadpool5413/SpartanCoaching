import "react-native-gesture-handler";

import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { navigationTheme, colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "800" },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="contact" options={{ title: "Contact & Discovery", presentation: "modal" }} />
          <Stack.Screen name="drills" options={{ title: "Daily Drill" }} />
          <Stack.Screen name="roleplay" options={{ title: "Role Play" }} />
          <Stack.Screen name="tools/[slug]" options={{ title: "Tools" }} />
          <Stack.Screen name="calculators/[slug]" options={{ title: "Calculators" }} />
          <Stack.Screen name="assessment/[id]" options={{ title: "Assessment" }} />
          <Stack.Screen name="content/[slug]" options={{ title: "Knowledge Base" }} />
          <Stack.Screen name="articles/[id]" options={{ title: "Article" }} />
          <Stack.Screen name="resources/[id]" options={{ title: "Resource" }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
