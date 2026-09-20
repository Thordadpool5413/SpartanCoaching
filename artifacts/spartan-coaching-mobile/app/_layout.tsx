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
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { registerNotificationRescheduleTask } from "@/lib/notificationReschedule";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { trackMobileEvent } from "@/lib/analytics";
import { fetchClientConfig } from "@/lib/clientConfig";
import { ActivationCeremony } from "@/components/ActivationCeremony";
import { DeepLinkRouter } from "@/components/DeepLinkRouter";
import { AppearanceProvider, useAppearancePreference } from "@/lib/AppearanceContext";
import { LaunchExperience } from "@/components/LaunchExperience";
import { CoachSessionProvider } from "@/lib/CoachSessionContext";
import { VoiceActivityBanner } from "@/components/VoiceActivityBanner";

// Native splash APIs can reject when a release resumes after iOS has already
// dismissed the launch screen. Never turn that recoverable race into an
// unhandled startup rejection.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 260, fade: true });

const queryClient = new QueryClient();

function AppOpenTracker() {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.member?.id) trackMobileEvent("mobile_app_open", "app_open");
  }, [user?.member?.id]);
  return null;
}

const APP_STORE_URL = "https://apps.apple.com/app/id6795266551";

function ClientConfigGate({ children }: { children: React.ReactNode }) {
  const [updateReason, setUpdateReason] = useState<string | null>(null);
  const [minimumVersion, setMinimumVersion] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    void fetchClientConfig().then((cfg) => {
      if (cfg?.compatibility?.ios && !cfg.compatibility.ios.ok) {
        setUpdateReason(cfg.compatibility.ios.reason || "This version is no longer supported.");
        setMinimumVersion(cfg.minIosAppVersion || null);
      }
    });
  }, []);

  if (!updateReason) return <>{children}</>;

  return (
    <View style={updateStyles.screen} accessibilityViewIsModal>
      <View style={updateStyles.card}>
        <Text style={updateStyles.kicker}>UPDATE REQUIRED</Text>
        <Text style={updateStyles.title}>A newer version of Hospice Sales Pro is ready.</Text>
        <Text style={updateStyles.body}>
          {updateReason}{minimumVersion ? ` Update to version ${minimumVersion} or later to continue.` : ""}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the App Store to update Hospice Sales Pro"
          onPress={() => void Linking.openURL(APP_STORE_URL)}
          style={({ pressed }) => [updateStyles.button, pressed && updateStyles.buttonPressed]}
        >
          <Text style={updateStyles.buttonText}>OPEN APP STORE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const updateStyles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#07111F", padding: 24 },
  card: { width: "100%", maxWidth: 420, borderRadius: 24, borderCurve: "continuous", backgroundColor: "#10243C", padding: 24 },
  kicker: { color: "#FDB927", fontSize: 11, fontWeight: "800", letterSpacing: 1.6 },
  title: { color: "#FFFFFF", fontSize: 26, fontWeight: "800", lineHeight: 32, marginTop: 12 },
  body: { color: "#D5DFEA", fontSize: 15, lineHeight: 22, marginTop: 12 },
  button: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#C8102E", marginTop: 24, paddingHorizontal: 18 },
  buttonPressed: { opacity: 0.78 },
  buttonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", letterSpacing: 1.1 },
});

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
      <Stack.Screen name="support" options={{ title: "Support", presentation: "modal" }} />
      <Stack.Screen name="legal" options={{ title: "Legal & Trust", presentation: "modal" }} />
      <Stack.Screen name="jurisdiction" options={{ title: "Clinical Context", headerBackTitle: "Account" }} />
      <Stack.Screen name="tour" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="admin" options={{ title: "Admin", headerBackTitle: "Account" }} />
      <Stack.Screen name="brand-video" options={{ title: "Brand Video" }} />
      <Stack.Screen name="staffing" options={{ title: "Branch Staffing" }} />
      <Stack.Screen name="activity-calculator" options={{ title: "Activity Calculator" }} />
      <Stack.Screen name="roi-calculator" options={{ title: "ROI Calculator" }} />
      <Stack.Screen name="rep-cost-calculator" options={{ title: "Rep Cost Calculator" }} />
      <Stack.Screen name="transcriber" options={{ title: "Call Transcriber" }} />
      <Stack.Screen name="spartan-intelligence" options={{ headerShown: false }} />
      <Stack.Screen name="library-item" options={{ title: "Library", headerBackTitle: "Library" }} />
      <Stack.Screen name="method-guide" options={{ title: "Spartan Method", headerBackTitle: "Library" }} />
      <Stack.Screen name="consulting-schedule" options={{ title: "Choose a time", headerBackTitle: "Consulting" }} />
      <Stack.Screen
        name="sales-workflow"
        options={{ title: "Field Planner", headerBackTitle: "Back" }}
      />
      <Stack.Screen name="tool/[tab]" options={{ headerShown: false, headerBackTitle: "Tools" }} />
      <Stack.Screen name="ai-tools" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
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
    void registerNotificationRescheduleTask();
  }, []);

  useEffect(() => {
    if (Platform.OS === "ios" || fontsLoaded || fontError) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (Platform.OS !== "ios" && !fontsLoaded && !fontError) return null;

  return (
    <AppearanceProvider>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <CoachSessionProvider>
                <ClientConfigGate>
                  <AppOpenTracker />
                  <DeepLinkRouter />
                  <ActivationCeremony />
                  <NativeChrome />
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <KeyboardProvider>
                      <VoiceActivityBanner />
                      <RootLayoutNav />
                    </KeyboardProvider>
                    {launchVisible ? <LaunchExperience onComplete={completeLaunch} /> : null}
                  </GestureHandlerRootView>
                </ClientConfigGate>
              </CoachSessionProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </AppearanceProvider>
  );
}

function NativeChrome() {
  const { effectiveScheme } = useAppearancePreference();
  return <StatusBar style={effectiveScheme === "dark" ? "light" : "dark"} />;
}
