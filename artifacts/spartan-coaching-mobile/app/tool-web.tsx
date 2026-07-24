import React, { useMemo } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getBaseUrl, getSessionToken } from "@/lib/api";
import { getToolById } from "@workspace/field-kit-catalog";
import { useEffect, useState } from "react";

/**
 * Authenticated WebView bridge for Field Kit tools not yet native.
 * Passes session token so web Field Kit routes work on mobile.
 */
export default function ToolWebScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ toolId?: string; path?: string }>();
  const tool = params.toolId ? getToolById(String(params.toolId)) : undefined;
  const webPath = params.path || tool?.path || "/portal";
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSessionToken().then((t) => {
      setToken(t);
      setReady(true);
    });
  }, []);

  const base = getBaseUrl();
  const uri = useMemo(() => {
    if (!base) return "";
    const url = new URL(webPath.startsWith("http") ? webPath : `${base}${webPath}`);
    if (token) url.searchParams.set("mobile_token", token);
    return url.toString();
  }, [base, webPath, token]);

  const injected = token
    ? `
    (function() {
      try {
        var token = ${JSON.stringify(token)};
        localStorage.setItem('spartan_mobile_token', token);
        var originalFetch = window.fetch;
        window.fetch = function(input, init) {
          init = init || {};
          var headers = new Headers(init.headers || {});
          if (token && !headers.has('Authorization')) {
            headers.set('Authorization', 'Bearer ' + token);
          }
          init.headers = headers;
          if (init.credentials === undefined) init.credentials = 'include';
          return originalFetch(input, init);
        };
      } catch (e) {}
      true;
    })();
  `
    : undefined;

  const title = tool?.title || "Field Kit";

  if (!base) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Stack.Screen options={{ title }} />
        <Text style={{ color: colors.foreground, fontWeight: "700", textAlign: "center", padding: 24 }}>
          API host not configured. Set EXPO_PUBLIC_DOMAIN or EXPO_PUBLIC_API_URL for this build.
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === "ios" ? 0 : insets.top }}>
      <Stack.Screen options={{ title, headerBackTitle: "Back" }} />
      <WebView
        source={{ uri }}
        style={{ flex: 1, backgroundColor: colors.background }}
        injectedJavaScriptBeforeContentLoaded={injected}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.center, StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
