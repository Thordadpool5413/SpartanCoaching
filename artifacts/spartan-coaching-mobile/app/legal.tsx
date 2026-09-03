import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useColors } from "@/hooks/useColors";
import {
  APP_STORE_PRIVACY_URL,
  APP_STORE_TERMS_URL,
  APP_STORE_TRUST_URL,
} from "@/lib/appStoreReadiness";
import { font } from "@/lib/typography";

const DOCUMENTS = {
  privacy: { title: "Privacy Policy", url: APP_STORE_PRIVACY_URL },
  terms: { title: "Terms of Use", url: APP_STORE_TERMS_URL },
  trust: { title: "Trust & Safety", url: APP_STORE_TRUST_URL },
} as const;

type DocumentKey = keyof typeof DOCUMENTS;

export default function LegalDocumentScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams<{ document?: string }>();
  const key: DocumentKey = params.document && params.document in DOCUMENTS
    ? params.document as DocumentKey
    : "privacy";
  const document = DOCUMENTS[key];
  const webView = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <View style={styles.screen} testID={`legal-document-${key}`}>
      <Stack.Screen options={{ title: document.title }} />
      <View style={styles.contextBar}>
        <Feather name="shield" size={17} color={colors.primary} />
        <Text style={styles.contextText}>You are still inside Spartan Coaching.</Text>
      </View>
      {failed ? (
        <View style={styles.center} accessibilityRole="alert">
          <View style={styles.icon}><Feather name="wifi-off" size={24} color={colors.primary} /></View>
          <Text style={styles.title}>This document could not load.</Text>
          <Text style={styles.body}>Check your secure connection and try again. Your place in the app is unchanged.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFailed(false);
              setLoading(true);
              webView.current?.reload();
            }}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <WebView
            ref={webView}
            source={{ uri: document.url }}
            originWhitelist={["https://*"]}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
            onHttpError={() => {
              setLoading(false);
              setFailed(true);
            }}
            onShouldStartLoadWithRequest={(request) => request.url.startsWith("https://spartanhospicecoaching.com/")}
            style={styles.webView}
            testID="legal-document-webview"
          />
          {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Loading securely</Text></View> : null}
        </>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    contextBar: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, backgroundColor: colors.primaryMuted, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
    contextText: { color: colors.mutedForeground, fontSize: 11, ...font("semibold") },
    webView: { flex: 1, backgroundColor: colors.background },
    loading: { ...StyleSheet.absoluteFill, top: 44, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.background },
    loadingText: { color: colors.mutedForeground, fontSize: 12, ...font("medium") },
    center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 12 },
    icon: { width: 54, height: 54, borderRadius: 18, borderCurve: "continuous", backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    title: { color: colors.foreground, fontSize: 24, textAlign: "center", ...font("heavy") },
    body: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, textAlign: "center", ...font("regular") },
    retry: { minHeight: 50, minWidth: 150, borderRadius: 16, borderCurve: "continuous", backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, marginTop: 6 },
    retryText: { color: "#FFFFFF", fontSize: 15, ...font("bold") },
  });
}
