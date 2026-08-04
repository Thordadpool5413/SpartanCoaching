import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { getBaseUrl, getSessionToken } from "@/lib/api";
import { getToolById } from "@workspace/field-kit-catalog";
import { font } from "@/lib/typography";
import { EmptyState } from "@/components/ui/EmptyState";
import { SpartanButton } from "@/components/ui/SpartanButton";

/**
 * Tier-B WebView bridge for Hospice Sales Pro tools not yet native.
 * Session via Bearer inject only — never in URL.
 * QA bar: badge, loading, retry, Safari escape, session expiry → login.
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
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);
  const webRef = useRef<WebView>(null);

  const loadToken = useCallback(async () => {
    setReady(false);
    try {
      const t = await getSessionToken();
      setToken(t);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void loadToken();
  }, [loadToken, reloadKey]);

  const base = getBaseUrl();
  const uri = useMemo(() => {
    if (!base) return "";
    try {
      const url = new URL(webPath.startsWith("http") ? webPath : `${base}${webPath}`);
      url.searchParams.delete("mobile_token");
      return url.toString();
    } catch {
      return "";
    }
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
          return originalFetch(input, init).then(function(res) {
            if (res.status === 401 || res.status === 403) {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'auth_expired', status: res.status }));
            }
            return res;
          });
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
  const pathLabel = (() => {
    try {
      return new URL(uri || "https://local").pathname;
    } catch {
      return webPath;
    }
  })();

  const openSafari = () => {
    if (!uri) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(uri);
  };

  const retry = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadError(null);
    setSessionExpired(false);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const onNavChange = (nav: WebViewNavigation) => {
    // Login / register pages often mean session dropped
    if (/\/(login|register|magic)/i.test(nav.url) && !nav.loading) {
      setSessionExpired(true);
    }
  };

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type?: string };
      if (msg.type === "auth_expired") setSessionExpired(true);
    } catch {
      // ignore non-JSON
    }
  };

  const chrome = (
    <View
      style={[
        styles.chrome,
        {
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
          paddingTop: Platform.OS === "ios" ? 0 : 0,
        },
      ]}
      testID="tool-web-chrome"
    >
      <View style={styles.chromeTop}>
        <View style={[styles.badge, { backgroundColor: colors.primaryMuted }]}>
          <Feather name="globe" size={12} color={colors.primary} />
          <Text style={[{ color: colors.primary, fontSize: 10, letterSpacing: 0.6 }, font("bold")]}>
            WEB TOOL
          </Text>
        </View>
        <Pressable onPress={openSafari} hitSlop={10} style={styles.iconBtn} testID="tool-web-safari">
          <Feather name="external-link" size={18} color={colors.primary} />
        </Pressable>
        <Pressable onPress={retry} hitSlop={10} style={styles.iconBtn} testID="tool-web-retry">
          <Feather name="refresh-cw" size={17} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <Text style={[{ color: colors.foreground, fontSize: 15 }, font("bold")]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }, font("regular")]} numberOfLines={1}>
        {pathLabel} · same product as website · session on device
      </Text>
    </View>
  );

  if (!base) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Stack.Screen options={{ title, headerBackTitle: "Back" }} />
        <View style={styles.pad}>
          <EmptyState
            icon="wifi-off"
            title="API host not configured"
            body="Set EXPO_PUBLIC_DOMAIN or EXPO_PUBLIC_API_URL for this build so web tools can load."
          />
        </View>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title, headerBackTitle: "Back" }} />
        <ActivityIndicator color={colors.primary} />
        <Text style={[{ color: colors.mutedForeground, marginTop: 12, fontSize: 13 }, font("regular")]}>
          Securing session…
        </Text>
      </View>
    );
  }

  if (sessionExpired) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Stack.Screen options={{ title, headerBackTitle: "Back" }} />
        {chrome}
        <View style={styles.pad}>
          <EmptyState
            icon="lock"
            title="Session expired"
            body="Sign in again to open this web tool with your Hospice Sales Pro access."
            ctaTitle="Sign in"
            onCta={() => router.replace("/login")}
          />
          <SpartanButton title="Retry with current session" variant="outline" onPress={retry} style={{ marginTop: 12 }} />
          {uri ? (
            <SpartanButton title="Open in Safari" variant="ghost" onPress={openSafari} style={{ marginTop: 8 }} />
          ) : null}
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Stack.Screen options={{ title, headerBackTitle: "Back" }} />
        {chrome}
        <View style={styles.pad}>
          <EmptyState
            icon="alert-circle"
            title="Could not load web tool"
            body={loadError}
            ctaTitle="Try again"
            onCta={retry}
          />
          {uri ? (
            <SpartanButton title="Open in Safari" variant="outline" onPress={openSafari} style={{ marginTop: 12 }} />
          ) : null}
          <SpartanButton
            title="Back to Tools"
            variant="ghost"
            onPress={() => router.back()}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title, headerBackTitle: "Back" }} />
      {chrome}
      <View style={{ flex: 1 }}>
        <WebView
          key={reloadKey}
          ref={webRef}
          source={{ uri }}
          style={{ flex: 1, backgroundColor: colors.background }}
          injectedJavaScriptBeforeContentLoaded={injected}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          startInLoadingState
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={onNavChange}
          onMessage={onMessage}
          onError={() => {
            setLoading(false);
            setLoadError("Could not load this tool. Check your connection and try again.");
          }}
          onHttpError={(e) => {
            setLoading(false);
            const status = e.nativeEvent.statusCode;
            if (status === 401 || status === 403) {
              setSessionExpired(true);
              return;
            }
            setLoadError(`Tool page returned ${status}. Try again or open in Safari.`);
          }}
        />
        {loading && (
          <View
            style={[styles.loadingOverlay, { backgroundColor: colors.background }]}
            pointerEvents="none"
            testID="tool-web-loading"
          >
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[{ color: colors.mutedForeground, marginTop: 12, fontSize: 13 }, font("regular")]}>
              Loading {title}…
            </Text>
            <Text style={[{ color: colors.mutedForeground, marginTop: 6, fontSize: 11 }, font("regular")]}>
              Web experience · prefer native tools when available
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  pad: { padding: 16, flex: 1, justifyContent: "center" },
  chrome: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  chromeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: "auto",
  },
  iconBtn: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
