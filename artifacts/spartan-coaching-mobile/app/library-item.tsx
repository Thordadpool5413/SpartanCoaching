import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getWebSiteUrl } from "@/lib/api";
import { font } from "@/lib/typography";
import { downloadLibraryItem, getDownloadedLibraryItem, removeDownloadedLibraryItem, type DownloadedLibraryItem } from "@/lib/libraryDownloads";
import { trackProductOutcome } from "@/lib/analytics";

type Kind = "article" | "audio" | "resource";

function one(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function safeUrl(value?: string) {
  if (!value) return null;
  const resolved = /^https:\/\//i.test(value)
    ? value
    : `${getWebSiteUrl()}${value.startsWith("/") ? "" : "/"}${value}`;
  try {
    const parsed = new URL(resolved);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export default function LibraryItemScreen() {
  const params = useLocalSearchParams<{ title?: string | string[]; url?: string | string[]; kind?: string | string[]; description?: string | string[] }>();
  const title = one(params.title) || "Spartan Library";
  const description = one(params.description) || "Field-ready Spartan Coaching resource.";
  const kind = (one(params.kind) || "resource") as Kind;
  const url = safeUrl(one(params.url));
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [downloaded, setDownloaded] = useState<DownloadedLibraryItem | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (url) void getDownloadedLibraryItem(url).then((item) => { if (active) setDownloaded(item); });
    return () => { active = false; };
  }, [url]);

  const activeUrl = downloaded?.localUri || url;

  const toggleDownload = async () => {
    if (!url || Platform.OS === "web" || downloadBusy) return;
    setDownloadBusy(true);
    try {
      if (downloaded) {
        await removeDownloadedLibraryItem(url);
        setDownloaded(null);
      } else {
        const item = await downloadLibraryItem({ sourceUrl: url, title, kind });
        setDownloaded(item);
        void trackProductOutcome("resource_completion", { resourceId: kind, platform: "ios" });
      }
    } catch (error) {
      Alert.alert("Download unavailable", error instanceof Error ? error.message : "This item could not be saved for offline use.");
    } finally {
      setDownloadBusy(false);
    }
  };

  return (
    <View style={styles.screen} testID="screen-library-item">
      <Stack.Screen options={{ title: kind === "audio" ? "Listen" : "Library" }} />
      <View style={styles.contextBar}>
        <View style={styles.contextIcon}><Feather name={kind === "audio" ? "headphones" : "book-open"} size={18} color={colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{kind === "audio" ? "SPARTAN AUDIO" : "IN-APP READER"}</Text>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        </View>
        {url && Platform.OS !== "web" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={downloaded ? "Remove offline download" : "Download for offline use"}
            onPress={() => void toggleDownload()}
            disabled={downloadBusy}
            style={styles.downloadButton}
          >
            {downloadBusy ? <ActivityIndicator color={colors.primary} /> : <Feather name={downloaded ? "check-circle" : "download"} size={19} color={colors.primary} />}
          </Pressable>
        ) : null}
      </View>
      {downloaded ? <View style={styles.offlineBanner}><Feather name="smartphone" size={14} color={colors.success} /><Text style={styles.offlineBannerText}>Available offline on this iPhone</Text></View> : null}
      {kind === "audio" && activeUrl ? (
        <AudioReader title={title} description={description} url={activeUrl} bottom={insets.bottom} />
      ) : activeUrl ? (
        <DocumentReader title={title} url={activeUrl} />
      ) : (
        <View style={styles.empty}>
          <Feather name="alert-circle" size={30} color={colors.primary} />
          <Text style={styles.emptyTitle}>This item is not available yet.</Text>
          <Text style={styles.emptyBody}>The publisher has not attached a secure in-app file.</Text>
        </View>
      )}
    </View>
  );
}

function DocumentReader({ title, url }: { title: string; url: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  if (Platform.OS === "web") {
    return <iframe title={title} src={url} style={{ flex: 1, width: "100%", border: "none" }} />;
  }

  return (
    <View style={styles.reader}>
      <WebView
        key={reloadKey}
        source={{ uri: url }}
        originWhitelist={["https://*", "file://*"]}
        onLoadStart={() => { setLoading(true); setFailed(false); }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setFailed(true); }}
        onHttpError={() => { setLoading(false); setFailed(true); }}
        onShouldStartLoadWithRequest={(request) => request.url.startsWith("https://") || request.url.startsWith("file://")}
        setSupportMultipleWindows={false}
        sharedCookiesEnabled
        style={{ flex: 1, backgroundColor: colors.card }}
        testID="library-native-reader"
      />
      {loading ? <View style={styles.readerOverlay}><ActivityIndicator color={colors.primary} /><Text style={styles.readerStatus}>Opening inside Spartan Coaching…</Text></View> : null}
      {failed ? (
        <View style={styles.readerOverlay}>
          <Feather name="wifi-off" size={28} color={colors.primary} />
          <Text style={styles.emptyTitle}>This resource could not load.</Text>
          <Text style={styles.emptyBody}>Check your secure connection, then try again.</Text>
          <Pressable style={styles.retry} onPress={() => setReloadKey((value) => value + 1)}><Text style={styles.retryText}>Try again</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

function AudioReader({ title, description, url, bottom }: { title: string; description: string; url: string; bottom: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const player = useAudioPlayer(url, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;

  return (
    <View style={[styles.audioBody, { paddingBottom: bottom + 28 }]}>
      <View style={styles.audioHero}>
        <View style={styles.audioMark}><Feather name="headphones" size={36} color="#FFFFFF" /></View>
        <Text style={styles.audioTitle}>{title}</Text>
        <Text style={styles.audioDescription}>{description}</Text>
      </View>
      <View style={styles.playerCard}>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
        <View style={styles.timeRow}><Text style={styles.time}>{clock(status.currentTime)}</Text><Text style={styles.time}>{clock(status.duration)}</Text></View>
        <View style={styles.controls}>
          <Pressable accessibilityLabel="Back 15 seconds" onPress={() => void player.seekTo(Math.max(0, status.currentTime - 15))} style={styles.secondaryControl}><Feather name="rotate-ccw" size={20} color={colors.foreground} /></Pressable>
          <Pressable accessibilityLabel={status.playing ? "Pause" : "Play"} onPress={() => status.playing ? player.pause() : player.play()} style={styles.playControl}>
            <Feather name={status.playing ? "pause" : "play"} size={28} color="#FFFFFF" />
          </Pressable>
          <Pressable accessibilityLabel="Forward 15 seconds" onPress={() => void player.seekTo(Math.min(status.duration || status.currentTime + 15, status.currentTime + 15))} style={styles.secondaryControl}><Feather name="rotate-cw" size={20} color={colors.foreground} /></Pressable>
        </View>
      </View>
      <View style={styles.offlineNote}><Feather name="smartphone" size={18} color={colors.primary} /><Text style={styles.offlineText}>Playback stays inside the Spartan Coaching app.</Text></View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    contextBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong, backgroundColor: colors.card },
    contextIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    downloadButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    offlineBanner: { minHeight: 34, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: colors.primaryMuted },
    offlineBannerText: { color: colors.success, fontSize: 10, ...font("bold") },
    kicker: { color: colors.primary, fontSize: 9, letterSpacing: 1.7, ...font("bold") },
    title: { color: colors.foreground, fontSize: 15, lineHeight: 20, marginTop: 2, ...font("bold") },
    reader: { flex: 1, backgroundColor: colors.card },
    readerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 28, gap: 10 },
    readerStatus: { color: colors.mutedForeground, fontSize: 13, ...font("medium") },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
    emptyTitle: { color: colors.foreground, fontSize: 19, textAlign: "center", ...font("heavy") },
    emptyBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 20, textAlign: "center", ...font("regular") },
    retry: { minHeight: 46, borderRadius: 14, backgroundColor: colors.primary, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", marginTop: 5 },
    retryText: { color: "#FFFFFF", fontSize: 14, ...font("bold") },
    audioBody: { flex: 1, padding: 20, justifyContent: "center", gap: 18 },
    audioHero: { alignItems: "center", gap: 10 },
    audioMark: { width: 82, height: 82, borderRadius: 26, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    audioTitle: { color: colors.foreground, fontSize: 26, lineHeight: 31, textAlign: "center", letterSpacing: -0.5, ...font("heavy") },
    audioDescription: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, textAlign: "center", ...font("regular") },
    playerCard: { backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.borderStrong, padding: 20, gap: 10 },
    progressTrack: { height: 5, borderRadius: 3, backgroundColor: colors.muted, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: colors.primary },
    timeRow: { flexDirection: "row", justifyContent: "space-between" },
    time: { color: colors.mutedForeground, fontSize: 11, fontVariant: ["tabular-nums"], ...font("medium") },
    controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 26, marginTop: 6 },
    playControl: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    secondaryControl: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
    offlineNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    offlineText: { color: colors.mutedForeground, fontSize: 12, ...font("medium") },
  });
}
