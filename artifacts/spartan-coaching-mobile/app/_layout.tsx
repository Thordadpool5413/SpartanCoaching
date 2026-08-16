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
import React, { useEffect } from "react";
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

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/** Fires a single app_open event when the authenticated user is known. */
function AppOpenTracker() {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.member?.id) {
      // memberId is derived server-side from the Bearer session token — don't pass it here.
      trackMobileEvent("mobile_app_open", "app_open");
    }
  }, [user?.member?.id]);
  return null;
}

/** Loads delivery contract / feature flags; logs soft incompatibility (HSP-44). */
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
      <Stack.Screen name="brand-video" options={{ title: "Brand Video" }} />
      <Stack.Screen name="staffing" options={{ title: "Branch Staffing" }} />
      <Stack.Screen name="activity-calculator" options={{ title: "Activity Calculator" }} />
      <Stack.Screen name="roi-calculator" options={{ title: "ROI Calculator" }} />
      <Stack.Screen name="rep-cost-calculator" options={{ title: "Rep Cost Calculator" }} />
      <Stack.Screen
        name="sales-workflow"
        options={{ title: "Sales Command Center", headerBackTitle: "Back" }}
      />
      <Stack.Screen name="tool-web" options={{ title: "Hospice Sales Pro", headerBackTitle: "Back" }} />
      <Stack.Screen name="tool/[tab]" options={{ headerShown: false, headerBackTitle: "Tools" }} />
      <Stack.Screen name="ai-tools" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // iOS uses SF Pro (system). Load Inter only on Android/web for brand parity.
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
    if (Platform.OS === "ios" || fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
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
              {/* System appearance with an optional user override. */}
              <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </AppearanceProvider>
  );
}
