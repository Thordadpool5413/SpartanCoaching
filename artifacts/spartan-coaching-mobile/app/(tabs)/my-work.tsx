import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpartanHeader } from "@/components/ui/SpartanHeader";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { listDownloadedLibraryItems, type DownloadedLibraryItem } from "@/lib/libraryDownloads";
import { font } from "@/lib/typography";
import { deleteCalculatorReport, listCalculatorReports, type SavedCalculatorReport } from "@/lib/calculatorHistory";
import { apiGet } from "@/lib/api";
import { loadCachedCommitment } from "@/lib/commitmentCache";
import { openToolHref } from "@/lib/toolDeepLinks";
import { getToolById } from "@workspace/field-kit-catalog";
import { getSpartanAiTool } from "@workspace/spartan-ai-tools";

type MemberWorkItem = {
  id: string;
  toolId: string;
  title: string;
  kind: string;
  status: string;
  nextAction?: { title: string; href?: string } | null;
  updatedAt: string;
};

export default function MyWorkScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, canUseElite, user } = useAuth();
  const [downloads, setDownloads] = useState<DownloadedLibraryItem[]>([]);
  const [reports, setReports] = useState<SavedCalculatorReport[]>([]);
  const [memberWork, setMemberWork] = useState<MemberWorkItem[]>([]);
  const [commitment, setCommitment] = useState<string | null>(null);
  const [loadingWork, setLoadingWork] = useState(false);
  const [workError, setWorkError] = useState("");
  const topPad = Platform.OS === "web" ? 54 : insets.top;
  const bottomPad = Platform.OS === "web" ? 30 : insets.bottom + 24;

  const loadMemberWork = useCallback(async () => {
    const result = await apiGet<{ items: MemberWorkItem[] }>("/api/v1/member-work");
    return result.items || [];
  }, []);

  const refreshWork = useCallback(async () => {
    setLoadingWork(true);
    setWorkError("");
    try {
      const nextWork = await loadMemberWork();
      setMemberWork(nextWork);
    } catch (error) {
      setWorkError(error instanceof Error ? error.message : "Connected work is unavailable.");
    } finally {
      setLoadingWork(false);
    }
  }, [loadMemberWork]);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    setLoadingWork(true);
    setWorkError("");
    void Promise.all([
      listDownloadedLibraryItems(),
      listCalculatorReports(),
      loadMemberWork().catch((error) => {
        if (!cancelled) setWorkError(error instanceof Error ? error.message : "Connected work is unavailable.");
        return [];
      }),
      user?.member.id ? loadCachedCommitment(user.member.id) : Promise.resolve(null),
    ]).then(([nextDownloads, nextReports, nextWork, nextCommitment]) => {
      if (cancelled) return;
      setDownloads(nextDownloads);
      setReports(nextReports);
      setMemberWork(nextWork);
      setCommitment(nextCommitment);
      setLoadingWork(false);
    });
    return () => { cancelled = true; };
  }, [user?.member.id, loadMemberWork]));

  const openMemberWork = (item: MemberWorkItem) => {
    const classic = getToolById(item.toolId);
    if (classic?.mobileToolTab) {
      router.push(openToolHref(classic.mobileToolTab as any) as never);
      return;
    }
    if (classic?.mobileRoute) {
      router.push(classic.mobileRoute as never);
      return;
    }
    const advanced = getSpartanAiTool(item.toolId);
    router.push((advanced?.mobilePath || "/(tabs)/tools") as never);
  };

  const openDownload = (item: DownloadedLibraryItem) => {
    router.push({
      pathname: "/library-item",
      params: {
        title: item.title,
        url: item.localUri || "",
        kind: item.kind,
        description: item.description || "",
        downloadKey: item.sourceUrl,
        articleId: item.sourceUrl.startsWith("spartan://article/")
          ? item.sourceUrl.replace("spartan://article/", "")
          : undefined,
      },
    } as never);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 28 }}
      showsVerticalScrollIndicator={false}
      testID="screen-my-work"
    >
      <View style={styles.page}>
        <SpartanHeader title="My Work" />
        <View style={styles.badge}><Text style={styles.badgeText}>SAVED CONTINUITY</Text></View>
        <Text style={styles.title}>Keep the work that is ready to return to.</Text>
        <Text style={styles.subtitle}>Saved reports, approved outputs, and offline Library downloads stay organized here.</Text>

        {!canUseFieldKit ? (
          <View style={styles.emptyCard}>
            <Feather name="lock" size={23} color={colors.primary} />
            <Text style={styles.emptyTitle}>Membership protects your work</Text>
            <Text style={styles.emptyBody}>Choose Standard or Elite to save plans, downloads, and commitments across sessions.</Text>
            <Pressable style={styles.primaryButton} onPress={() => router.push("/membership" as never)}>
              <Text style={styles.primaryText}>Compare memberships</Text>
              <Feather name="arrow-right" size={19} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <>
            {canUseElite ? (
              <>
                <Text style={styles.sectionLabel}>ELITE OUTPUTS</Text>
                <WorkRow icon="shield" title="Saved Elite outputs" body="Review completed nonclinical work, status, and full results." onPress={() => router.push("/saved-ai-outputs" as never)} />
              </>
            ) : null}

            {commitment ? (
              <>
                <Text style={styles.sectionLabel}>CURRENT COMMITMENT</Text>
                <View style={styles.commitmentCard}>
                  <View style={styles.cardTop}>
                    <Text style={styles.privateLabel}>PRIVATE COACHING COMMITMENT</Text>
                    <Feather name="lock" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.commitmentTitle}>{commitment}</Text>
                  <Text style={styles.commitmentBody}>Return to Coach when you are ready to review the outcome or set the next commitment.</Text>
                  <Pressable style={styles.commitmentAction} onPress={() => router.push("/(tabs)/coach" as never)} accessibilityRole="button">
                    <Text style={styles.commitmentActionText}>Open Coach</Text>
                    <Feather name="arrow-right" size={17} color={colors.primary} />
                  </Pressable>
                </View>
              </>
            ) : null}

            <Text style={styles.sectionLabel}>CONNECTED WORK</Text>
            {loadingWork ? (
              <View style={styles.loadingCard}><ActivityIndicator color={colors.primary} /><Text style={styles.downloadEmptyText}>Loading work from web and iPhone…</Text></View>
            ) : workError ? (
              <View style={styles.errorCard}>
                <View style={styles.errorHeader}>
                  <Feather name="alert-circle" size={18} color={colors.destructive} />
                  <Text style={styles.errorTitle}>Connection failed</Text>
                </View>
                <Text style={styles.errorBody}>{workError}</Text>
                <Pressable accessibilityRole="button" style={styles.retryButton} onPress={refreshWork}>
                  <Feather name="refresh-cw" size={15} color={colors.foreground} />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : memberWork.length ? memberWork.slice(0, 12).map((item) => (
              <WorkRow
                key={item.id}
                icon={item.status === "draft" ? "edit-3" : "check-circle"}
                iconColor={item.status === "draft" ? colors.mutedForeground : colors.primary}
                title={item.title}
                body={`${item.kind.replaceAll("_", " ")} · ${item.status === "draft" ? "Draft" : "Completed"} · ${new Date(item.updatedAt).toLocaleDateString()}${item.nextAction?.title ? ` · ${item.nextAction.title}` : ""}`}
                onPress={() => openMemberWork(item)}
              />
            )) : (
              <View style={styles.downloadEmpty}><Text style={styles.downloadEmptyText}>Completed plans, tool results, and resource work from either device will appear here.</Text></View>
            )}

            {reports.length ? (
              <>
                <Text style={styles.sectionLabel}>SAVED DECISION REPORTS</Text>
                {reports.slice(0, 6).map((report) => (
                  <SavedReportRow key={report.id} report={report} onDelete={async () => { await deleteCalculatorReport(report.id); setReports((current) => current.filter((item) => item.id !== report.id)); }} />
                ))}
              </>
            ) : null}

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionLabel}>DOWNLOADS</Text>
              <Pressable onPress={() => router.push("/(tabs)/learn" as never)} hitSlop={8}><Text style={styles.openLibrary}>Open Library</Text></Pressable>
            </View>
            {downloads.length ? downloads.slice(0, 4).map((item) => (
              <WorkRow
                key={item.sourceUrl}
                icon={item.availability === "unavailable" ? "cloud-off" : item.kind === "audio" ? "headphones" : "file-text"}
                iconColor={item.availability === "unavailable" ? colors.destructive : colors.primary}
                title={item.title}
                body={item.availability === "unavailable" ? "Unavailable offline. Reconnect to download." : "Available offline on this iPhone."}
                onPress={() => openDownload(item)}
              />
            )) : (
              <View style={styles.downloadEmpty}><Text style={styles.downloadEmptyText}>Saved Library items will appear here for offline access.</Text></View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function SavedReportRow({ report, onDelete }: { report: SavedCalculatorReport; onDelete: () => void | Promise<void> }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const route = report.kind === "activity" ? "/activity-calculator" : report.kind === "roi" ? "/roi-calculator" : report.kind === "rep-cost" ? "/rep-cost-calculator" : "/staffing";
  return <View style={styles.savedReport}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Reopen ${report.title}`} onPress={() => router.push(route as never)} style={({ pressed }) => [styles.savedReportMain, pressed && styles.pressed]}>
      <View style={styles.rowIcon}><Feather name="bar-chart-2" size={19} color={colors.primary} /></View>
      <View style={{ flex: 1 }}><Text style={styles.rowTitle}>{report.title}</Text><Text style={styles.rowBody} numberOfLines={2}>{report.summary}</Text><Text style={styles.reportDate}>{new Date(report.createdAt).toLocaleDateString()}</Text></View>
      <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${report.title}`} onPress={() => void onDelete()} hitSlop={8} style={styles.deleteReport}><Feather name="trash-2" size={17} color={colors.mutedForeground} /></Pressable>
  </View>;
}

function WorkRow({ icon, iconColor, title, body, onPress }: { icon: React.ComponentProps<typeof Feather>["name"]; iconColor?: string; title: string; body: string; onPress: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowIcon}><Feather name={icon} size={19} color={iconColor || colors.primary} /></View>
      <View style={{ flex: 1 }}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowBody}>{body}</Text></View>
      <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    page: { paddingHorizontal: 22 },
    badge: { alignSelf: "flex-start", marginTop: 16, borderRadius: 999, backgroundColor: colors.secondary, paddingHorizontal: 11, paddingVertical: 7 },
    badgeText: { color: colors.primary, fontSize: 9, letterSpacing: 1, ...font("bold") },
    title: { color: colors.foreground, fontSize: 38, lineHeight: 44, letterSpacing: -1.3, marginTop: 22, ...font("heavy") },
    subtitle: { color: colors.mutedForeground, fontSize: 15, lineHeight: 22, marginTop: 5, ...font("regular") },
    sectionLabel: { color: colors.primary, fontSize: 10, letterSpacing: 1.8, marginTop: 36, marginBottom: 14, ...font("bold") },
    sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    openLibrary: { color: colors.primary, fontSize: 11, marginTop: 20, ...font("bold") },
    commitmentCard: { minHeight: 150, borderRadius: 22, borderCurve: "continuous", backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.borderStrong, padding: 18 },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    privateLabel: { color: colors.primary, fontSize: 9, letterSpacing: 1.4, ...font("bold") },
    commitmentTitle: { color: colors.foreground, fontSize: 19, lineHeight: 24, marginTop: 20, ...font("heavy") },
    commitmentBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 5, ...font("regular") },
    commitmentAction: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
    commitmentActionText: { color: colors.primary, fontSize: 13, ...font("bold") },
    row: { minHeight: 94, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 18, borderCurve: "continuous", backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 15, marginBottom: 12 },
    rowIcon: { width: 42, height: 42, borderRadius: 14, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    rowTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    rowBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3, ...font("regular") },
    savedReport: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
    savedReportMain: { flex: 1, minHeight: 92, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
    reportDate: { color: colors.primary, fontSize: 9, marginTop: 5, ...font("bold") },
    deleteReport: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    downloadEmpty: { minHeight: 92, alignItems: "center", justifyContent: "center", borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 18 },
    loadingCard: { minHeight: 92, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 18 },
    errorCard: { borderRadius: 18, borderWidth: 1, borderColor: colors.destructive + "40", backgroundColor: colors.card, padding: 18 },
    errorHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    errorTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    errorBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 18, marginTop: 8, ...font("regular") },
    retryButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, marginTop: 14, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.secondary },
    retryButtonText: { color: colors.foreground, fontSize: 13, ...font("bold") },
    downloadEmptyText: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, textAlign: "center", ...font("regular") },
    emptyCard: { borderRadius: 22, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, padding: 20, marginTop: 30 },
    emptyTitle: { color: colors.foreground, fontSize: 20, marginTop: 16, ...font("heavy") },
    emptyBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, ...font("regular") },
    primaryButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 17, backgroundColor: colors.primary, marginTop: 18 },
    primaryText: { color: "#FFFFFF", fontSize: 15, ...font("bold") },
    pressed: { opacity: 0.68 },
  });
}
