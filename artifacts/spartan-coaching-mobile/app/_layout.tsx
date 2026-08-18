import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { registerRescheduleTask } from "@/lib/notifications";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { trackMobileEvent } from "@/lib/analytics";
import { fetchClientConfig } from "@/lib/clientConfig";
import { ActivationCeremony } from "@/components/ActivationCeremony";
import { DeepLinkRouter } from "@/components/DeepLinkRouter";
import { AppearanceProvider } from "@/lib/AppearanceContext";
import { LaunchExperience } from "@/components/LaunchExperience";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AppOpenTracker() {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.member?.id) trackMobileEvent("mobile_app_open", "app_open");
  }, [user?.member?.id]);
  return null;
}

function ClientConfigBootstrap() {
  useEffect(() => {
    void fetchClientConfig().then((cfg) => {
      if (cfg?.compatibility?.ios && !cfg.compatibility.ios.ok) {
        console.warn(
          "[client-config] iOS build may be below server min",
          cfg.compatibility.ios.reason,
          cfg.minIosAppVersion,
        );
      }
    });
  }, []);
  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Sign in", presentation: "modal" }} />
      <Stack.Screen name="register" options={{ title: "Create account", presentation: "modal" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Reset password", presentation: "modal" }} />
      <Stack.Screen name="reset-password" options={{ title: "Choose new password", presentation: "modal" }} />
      <Stack.Screen name="membership" options={{ title: "Membership", presentation: "modal" }} />
      <Stack.Screen name="access" options={{ title: "Your Access", presentation: "modal" }} />
      <Stack.Screen name="jurisdiction" options={{ title: "Clinical Context", headerBackTitle: "Account" }} />
      <Stack.Screen name="tour" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="admin" options={{ title: "Admin", headerBackTitle: "Account" }} />
      <Stack.Screen name="brand-video" options={{ title: "Brand Video" }} />
      <Stack.Screen name="staffing" options={{ title: "Branch Staffing" }} />
      <Stack.Screen name="activity-calculator" options={{ title: "Activity Calculator" }} />
      <Stack.Screen name="roi-calculator" options={{ title: "ROI Calculator" }} />
      <Stack.Screen name="rep-cost-calculator" options={{ title: "Rep Cost Calculator" }} />
      <Stack.Screen name="transcriber" options={{ title: "Call Transcriber" }} />
      <Stack.Screen name="library-item" options={{ title: "Library", headerBackTitle: "Library" }} />
      <Stack.Screen name="method-guide" options={{ title: "Spartan Method", headerBackTitle: "Library" }} />
      <Stack.Screen
        name="sales-workflow"
        options={{ title: "Sales Command Center", headerBackTitle: "Back" }}
      />
      <Stack.Screen name="tool/[tab]" options={{ headerShown: false, headerBackTitle: "Tools" }} />
      <Stack.Screen name="ai-tools" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [launchVisible, setLaunchVisible] = useState(true);
  const completeLaunch = useCallback(() => setLaunchVisible(false), []);
  const [fontsLoaded, fontError] = useFonts(
    Platform.OS === "ios"
      ? {}
      : {
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        },
  );

  useEffect(() => {
    registerRescheduleTask();
  }, []);

  useEffect(() => {
    if (Platform.OS === "ios" || fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (Platform.OS !== "ios" && !fontsLoaded && !fontError) return null;

  return (
    <AppearanceProvider>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ClientConfigBootstrap />
              <AppOpenTracker />
              <DeepLinkRouter />
              <ActivationCeremony />
              <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
                {launchVisible ? <LaunchExperience onComplete={completeLaunch} /> : null}
              </GestureHandlerRootView>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </AppearanceProvider>
  );
}
