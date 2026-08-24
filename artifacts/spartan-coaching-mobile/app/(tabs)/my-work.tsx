import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpartanHeader } from "@/components/ui/SpartanHeader";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { listDownloadedLibraryItems, type DownloadedLibraryItem } from "@/lib/libraryDownloads";
import { font } from "@/lib/typography";
import { deleteCalculatorReport, listCalculatorReports, type SavedCalculatorReport } from "@/lib/calculatorHistory";

export default function MyWorkScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { canUseFieldKit, canUseElite } = useAuth();
  const [downloads, setDownloads] = useState<DownloadedLibraryItem[]>([]);
  const [reports, setReports] = useState<SavedCalculatorReport[]>([]);
  const topPad = Platform.OS === "web" ? 54 : insets.top;
  const bottomPad = Platform.OS === "web" ? 30 : insets.bottom + 24;

  useFocusEffect(useCallback(() => {
    void listDownloadedLibraryItems().then(setDownloads);
    void listCalculatorReports().then(setReports);
  }, []));

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
              <WorkRow key={item.sourceUrl} icon={item.kind === "audio" ? "headphones" : "file-text"} title={item.title} body={item.availability === "unavailable" ? "Listed in your Library, but not downloaded on this iPhone. Download again for offline use." : "Available offline on this iPhone."} onPress={() => openDownload(item)} />
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

function WorkRow({ icon, title, body, onPress }: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; body: string; onPress: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowIcon}><Feather name={icon} size={19} color={colors.primary} /></View>
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
    row: { minHeight: 94, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 18, borderCurve: "continuous", backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 15, marginBottom: 12 },
    rowIcon: { width: 42, height: 42, borderRadius: 14, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    rowTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    rowBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3, ...font("regular") },
    savedReport: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
    savedReportMain: { flex: 1, minHeight: 92, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
    reportDate: { color: colors.primary, fontSize: 9, marginTop: 5, ...font("bold") },
    deleteReport: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    downloadEmpty: { minHeight: 92, alignItems: "center", justifyContent: "center", borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 18 },
    downloadEmptyText: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, textAlign: "center", ...font("regular") },
    emptyCard: { borderRadius: 22, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, padding: 20, marginTop: 30 },
    emptyTitle: { color: colors.foreground, fontSize: 20, marginTop: 16, ...font("heavy") },
    emptyBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 6, ...font("regular") },
    primaryButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 17, backgroundColor: colors.primary, marginTop: 18 },
    primaryText: { color: "#FFFFFF", fontSize: 15, ...font("bold") },
    pressed: { opacity: 0.68 },
  });
}
