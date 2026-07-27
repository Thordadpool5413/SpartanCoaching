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
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { registerRescheduleTask } from "@/lib/notifications";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { trackMobileEvent } from "@/lib/analytics";

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

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Sign in", presentation: "modal" }} />
      <Stack.Screen name="brand-video" options={{ title: "Brand Video" }} />
      <Stack.Screen name="staffing" options={{ title: "Branch Staffing" }} />
      <Stack.Screen name="activity-calculator" options={{ title: "Activity Calculator" }} />
      <Stack.Screen name="roi-calculator" options={{ title: "ROI Calculator" }} />
      <Stack.Screen name="rep-cost-calculator" options={{ title: "Rep Cost Calculator" }} />
      <Stack.Screen
        name="sales-workflow"
        options={{ title: "Sales Command Center", headerBackTitle: "Back" }}
      />
      <Stack.Screen name="tool-web" options={{ title: "Field Kit", headerBackTitle: "Back" }} />
      <Stack.Screen name="ai-tools" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    registerRescheduleTask();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppOpenTracker />
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
