import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { getBaseUrl, getSessionToken } from "@/lib/api";
import { getToolById } from "@workspace/field-kit-catalog";
import { useEffect, useState } from "react";

/**
 * Authenticated WebView bridge for Hospice Sales Pro tools not yet native.
 * Session via Bearer inject only — never in URL.
 */
export default function ToolWebScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ toolId?: string; path?: string }>();
  const tool = params.toolId ? getToolById(String(params.toolId)) : undefined;
  const webPath = params.path || tool?.path || "/portal";
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    url.searchParams.delete("mobile_token");
    return url.toString();
  }, [base, webPath]);

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
        try {
          if (window.history && window.location.search.indexOf('mobile_token') !== -1) {
            var u = new URL(window.location.href);
            u.searchParams.delete('mobile_token');
            window.history.replaceState({}, '', u.pathname + u.search + u.hash);
          }
        } catch (e2) {}
      } catch (e) {}
      true;
    })();
  `
    : undefined;

  const title = tool?.title || "Hospice Sales Pro";

  if (!base) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <Stack.Screen options={{ title }} />
        <Feather name="wifi-off" size={28} color={colors.primary} />
        <Text style={{ color: colors.foreground, fontWeight: "800", textAlign: "center", marginTop: 12, fontSize: 16 }}>
          API host not configured
        </Text>
        <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
          Set EXPO_PUBLIC_DOMAIN or EXPO_PUBLIC_API_URL for this build so Hospice Sales Pro tools can load.
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title }} />
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 13 }}>Securing session…</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingHorizontal: 24 }]}>
        <Stack.Screen options={{ title }} />
        <Text style={{ color: colors.foreground, fontWeight: "800", textAlign: "center" }}>{loadError}</Text>
        <Pressable
          onPress={() => {
            setLoadError(null);
          }}
          style={{
            marginTop: 16,
            backgroundColor: colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>Try again</Text>
        </Pressable>
        {uri ? (
          <Pressable onPress={() => Linking.openURL(uri)} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Open in browser →</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === "ios" ? 0 : insets.top }}>
      <Stack.Screen options={{ title, headerBackTitle: "Tools" }} />
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Feather name="monitor" size={16} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 13 }}>{title}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
            Hospice Sales Pro · session secured on this device
          </Text>
        </View>
        {uri ? (
          <Pressable onPress={() => Linking.openURL(uri)} hitSlop={8}>
            <Feather name="external-link" size={18} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      <WebView
        source={{ uri }}
        style={{ flex: 1, backgroundColor: colors.background }}
        injectedJavaScriptBeforeContentLoaded={injected}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        startInLoadingState
        onError={() => setLoadError("Could not load this tool. Check your connection and try again.")}
        onHttpError={() => setLoadError("Tool page returned an error. Try again or open in browser.")}
        renderLoading={() => (
          <View style={[styles.center, StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, marginTop: 10, fontSize: 13 }}>Loading {title}…</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
