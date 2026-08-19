import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { apiGet, getWebSiteUrl } from "@/lib/api";
import { font } from "@/lib/typography";
import { downloadLibraryItem, getDownloadedLibraryItem, removeDownloadedLibraryItem, saveTextLibraryItem, type DownloadedLibraryItem } from "@/lib/libraryDownloads";
import { trackProductOutcome } from "@/lib/analytics";

type Kind = "article" | "audio" | "resource";

type ArticleDetail = {
  id: number;
  title: string;
  description: string;
  content?: string | null;
  linkedinUrl?: string | null;
  pdfUrl?: string | null;
};

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
  const params = useLocalSearchParams<{
    title?: string | string[];
    url?: string | string[];
    sourceUrl?: string | string[];
    kind?: string | string[];
    description?: string | string[];
    articleId?: string | string[];
    whenToUse?: string | string[];
    whyItMatters?: string | string[];
    expectedOutcome?: string | string[];
    version?: string | string[];
    downloadKey?: string | string[];
  }>();
  const title = one(params.title) || "Spartan Library";
  const description = one(params.description) || "Field-ready Spartan Coaching resource.";
  const kind = (one(params.kind) || "resource") as Kind;
  const articleId = one(params.articleId);
  const url = safeUrl(one(params.url));
  const sourceUrl = safeUrl(one(params.sourceUrl));
  const downloadKey = one(params.downloadKey) || (kind === "article" && articleId ? `spartan://article/${articleId}` : url);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [downloaded, setDownloaded] = useState<DownloadedLibraryItem | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [articleLoading, setArticleLoading] = useState(Boolean(articleId));
  const [articleFailed, setArticleFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (downloadKey) void getDownloadedLibraryItem(downloadKey).then((item) => { if (active) setDownloaded(item); });
    return () => { active = false; };
  }, [downloadKey]);

  useEffect(() => {
    let active = true;
    if (kind !== "article" || !articleId || downloaded?.content) {
      setArticleLoading(false);
      return () => { active = false; };
    }
    setArticleLoading(true);
    setArticleFailed(false);
    void apiGet<{ article: ArticleDetail }>(`/api/articles/${articleId}`)
      .then((response) => { if (active) setArticle(response.article); })
      .catch(() => { if (active) setArticleFailed(true); })
      .finally(() => { if (active) setArticleLoading(false); });
    return () => { active = false; };
  }, [articleId, downloaded?.content, kind]);

  const activeUrl = downloaded?.localUri || url;
  const articleContent = downloaded?.content || article?.content || null;
  const resolvedDescription = downloaded?.description || article?.description || description;
  const resolvedSourceUrl = safeUrl(article?.linkedinUrl || undefined) || sourceUrl;
  const resolvedDocumentUrl = safeUrl(article?.pdfUrl || undefined) || activeUrl;

  const toggleDownload = async () => {
    if (!downloadKey || Platform.OS === "web" || downloadBusy) return;
    setDownloadBusy(true);
    try {
      if (downloaded) {
        await removeDownloadedLibraryItem(downloadKey);
        setDownloaded(null);
      } else if (kind === "article" && (articleContent || resolvedDescription)) {
        const item = await saveTextLibraryItem({ sourceUrl: downloadKey, title, description: resolvedDescription, content: articleContent || resolvedDescription });
        setDownloaded(item);
        void trackProductOutcome("resource_completion", { resourceId: "article", platform: "ios" });
      } else if (url) {
        const item = await downloadLibraryItem({ sourceUrl: url, title, kind });
        setDownloaded(item);
        void trackProductOutcome("resource_completion", { resourceId: kind, platform: "ios" });
      } else {
        throw new Error("This item does not have complete offline content yet.");
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
        {downloadKey && (url || articleContent || (kind === "article" && resolvedDescription)) && Platform.OS !== "web" ? (
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
      {kind === "article" ? (
        <NativeArticleReader
          title={article?.title || title}
          description={resolvedDescription}
          content={articleContent}
          documentUrl={resolvedDocumentUrl}
          sourceUrl={resolvedSourceUrl}
          loading={articleLoading}
          failed={articleFailed}
        />
      ) : kind === "audio" && activeUrl ? (
        <AudioReader title={title} description={description} url={activeUrl} bottom={insets.bottom} />
      ) : kind === "resource" ? (
        <NativeResourceReader
          title={title}
          description={description}
          documentUrl={activeUrl}
          whenToUse={one(params.whenToUse)}
          whyItMatters={one(params.whyItMatters)}
          expectedOutcome={one(params.expectedOutcome)}
          version={one(params.version)}
        />
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

function NativeArticleReader({
  title,
  description,
  content,
  documentUrl,
  sourceUrl,
  loading,
  failed,
}: {
  title: string;
  description: string;
  content: string | null;
  documentUrl: string | null;
  sourceUrl: string | null;
  loading: boolean;
  failed: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (loading) return <View style={styles.empty}><ActivityIndicator color={colors.primary} /><Text style={styles.emptyBody}>Preparing the native field note…</Text></View>;
  if (documentUrl && !content) return <DocumentReader title={title} url={documentUrl} />;

  const paragraphs = content && content.trim() !== description.trim()
    ? content
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];

  return (
    <ScrollView contentContainerStyle={[styles.articleBody, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false} testID="library-native-reader">
      <View style={styles.articleBadge}><Text style={styles.articleBadgeText}>FIELD NOTE</Text></View>
      <Text style={styles.articleTitle}>{title}</Text>
      <Text style={styles.articleLead}>{description}</Text>

      <View style={styles.articleRule} />
      {paragraphs.map((paragraph, index) => (
        <Text selectable key={`${index}-${paragraph.slice(0, 18)}`} style={styles.articleText}>{paragraph}</Text>
      ))}

      {failed ? (
        <View style={styles.articleUnavailable}>
          <Feather name="wifi-off" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.articleUnavailableTitle}>The latest copy could not refresh</Text>
            <Text style={styles.articleUnavailableBody}>The field briefing above remains available. Reopen it when your secure connection returns to check for an expanded edition.</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.articleSectionTitle}>Take it into the field</Text>
      <View style={styles.articlePrompt}>
        <Feather name="message-square" size={19} color={colors.primary} />
        <Text style={styles.articlePromptText}>What is the one useful question or next step this idea should change in your next conversation?</Text>
      </View>

      {sourceUrl ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void WebBrowser.openBrowserAsync(sourceUrl)}
          style={styles.sourceButton}
        >
          <Text style={styles.sourceButtonText}>View the original source</Text>
          <Feather name="arrow-up-right" size={18} color={colors.primary} />
        </Pressable>
      ) : null}

      <View style={styles.articleTrust}>
        <Feather name="shield" size={17} color={colors.primary} />
        <Text style={styles.articleTrustText}>Educational guidance only. Never enter patient PHI. Clinical decisions require the appropriate medical director or compliance approval.</Text>
      </View>
    </ScrollView>
  );
}

function NativeResourceReader({
  title,
  description,
  documentUrl,
  whenToUse,
  whyItMatters,
  expectedOutcome,
  version,
}: {
  title: string;
  description: string;
  documentUrl: string | null;
  whenToUse?: string;
  whyItMatters?: string;
  expectedOutcome?: string;
  version?: string;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [documentOpen, setDocumentOpen] = useState(false);

  if (documentOpen && documentUrl) return <DocumentReader title={title} url={documentUrl} />;

  return (
    <ScrollView contentContainerStyle={[styles.articleBody, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false} testID="library-native-resource">
      <View style={styles.articleBadge}><Text style={styles.articleBadgeText}>{version ? `VERSION ${version}` : "FIELD RESOURCE"}</Text></View>
      <Text style={styles.articleTitle}>{title}</Text>
      <Text style={styles.articleLead}>{description}</Text>
      <View style={styles.articleRule} />

      {whenToUse ? <ResourceDetail label="WHEN TO USE IT" value={whenToUse} /> : null}
      {whyItMatters ? <ResourceDetail label="WHY IT MATTERS" value={whyItMatters} /> : null}
      {expectedOutcome ? <ResourceDetail label="WHAT YOU LEAVE WITH" value={expectedOutcome} /> : null}

      {documentUrl ? (
        <Pressable accessibilityRole="button" onPress={() => setDocumentOpen(true)} style={styles.openDocumentButton}>
          <View style={styles.openDocumentIcon}><Feather name="file-text" size={21} color="#FFFFFF" /></View>
          <View style={{ flex: 1 }}><Text style={styles.openDocumentTitle}>Open the attached resource</Text><Text style={styles.openDocumentBody}>Read and use it inside Spartan Coaching.</Text></View>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </Pressable>
      ) : (
        <View style={styles.articleUnavailable}>
          <Feather name="book-open" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}><Text style={styles.articleUnavailableTitle}>Use the resource overview</Text><Text style={styles.articleUnavailableBody}>The practical guidance above is available now. No separate attachment is required to use it.</Text></View>
        </View>
      )}

      <View style={styles.articleTrust}>
        <Feather name="shield" size={17} color={colors.primary} />
        <Text style={styles.articleTrustText}>Use only deidentified information. Clinical education is general guidance and requires appropriate medical director or compliance approval.</Text>
      </View>
    </ScrollView>
  );
}

function ResourceDetail({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={styles.resourceDetail}><Text style={styles.resourceDetailLabel}>{label}</Text><Text style={styles.resourceDetailValue}>{value}</Text></View>;
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
        injectedJavaScript={`(function(){var t=(document.title||'')+' '+(document.body&&document.body.innerText||'');if(/404|page not found|does not exist or may have been moved/i.test(t)){window.ReactNativeWebView.postMessage('SPARTAN_RESOURCE_NOT_FOUND');}})();true;`}
        onMessage={(event) => {
          if (event.nativeEvent.data === "SPARTAN_RESOURCE_NOT_FOUND") {
            setLoading(false);
            setFailed(true);
          }
        }}
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
    articleBody: { paddingHorizontal: 24, paddingTop: 30 },
    articleBadge: { alignSelf: "flex-start", borderRadius: 999, backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 7 },
    articleBadgeText: { color: colors.primary, fontSize: 9, letterSpacing: 1.3, ...font("bold") },
    articleTitle: { color: colors.foreground, fontSize: 32, lineHeight: 38, letterSpacing: -0.9, marginTop: 18, ...font("heavy") },
    articleLead: { color: colors.mutedForeground, fontSize: 16, lineHeight: 25, marginTop: 13, ...font("regular") },
    articleRule: { width: 42, height: 3, borderRadius: 2, backgroundColor: colors.primary, marginTop: 28, marginBottom: 24 },
    articleSectionTitle: { color: colors.foreground, fontSize: 20, lineHeight: 25, marginTop: 18, ...font("heavy") },
    articleText: { color: colors.mutedForeground, fontSize: 15, lineHeight: 24, marginTop: 8, ...font("regular") },
    articleUnavailable: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 19, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, padding: 17 },
    articleUnavailableTitle: { color: colors.foreground, fontSize: 14, ...font("bold") },
    articleUnavailableBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 4, ...font("regular") },
    articlePrompt: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, padding: 17, marginTop: 12 },
    articlePromptText: { flex: 1, color: colors.foreground, fontSize: 14, lineHeight: 21, ...font("semibold") },
    sourceButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 17, borderWidth: 1, borderColor: colors.primary, marginTop: 24 },
    sourceButtonText: { color: colors.primary, fontSize: 14, ...font("bold") },
    articleTrust: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.primaryMuted, borderRadius: 16, padding: 15, marginTop: 20 },
    articleTrustText: { flex: 1, color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("medium") },
    resourceDetail: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong, paddingVertical: 15 },
    resourceDetailLabel: { color: colors.primary, fontSize: 9, letterSpacing: 1.4, ...font("bold") },
    resourceDetailValue: { color: colors.foreground, fontSize: 15, lineHeight: 22, marginTop: 6, ...font("medium") },
    openDocumentButton: { minHeight: 82, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 20, backgroundColor: colors.primary, padding: 15, marginTop: 22 },
    openDocumentIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
    openDocumentTitle: { color: "#FFFFFF", fontSize: 15, ...font("bold") },
    openDocumentBody: { color: "rgba(255,255,255,0.78)", fontSize: 11, lineHeight: 16, marginTop: 3, ...font("regular") },
  });
}
