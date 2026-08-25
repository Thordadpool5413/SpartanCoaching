import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useColors } from "@/hooks/useColors";
import { getMicrosoftBookingsUrl } from "@/lib/consultingBookings";
import { font } from "@/lib/typography";

export default function ConsultingScheduleScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const url = getMicrosoftBookingsUrl();

  if (!url || failed) {
    return (
      <View style={styles.empty} testID="consulting-schedule-unavailable">
        <View style={styles.emptyIcon}><Feather name="calendar" size={25} color={colors.primary} /></View>
        <Text style={styles.emptyTitle}>Scheduling is temporarily unavailable</Text>
        <Text style={styles.emptyBody}>Your consulting request is still saved. Spartan Coaching will confirm an exact time directly.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="consulting-schedule">
      <View style={styles.notice}>
        <Feather name="shield" size={16} color={colors.primary} />
        <Text style={styles.noticeText}>Choose an exact time through Microsoft Bookings. Do not enter patient PHI.</Text>
      </View>
      <WebView
        source={{ uri: url }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setFailed(true); }}
        onHttpError={() => { setLoading(false); setFailed(true); }}
        onShouldStartLoadWithRequest={(request) => request.url.startsWith("https://")}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
        style={styles.webview}
      />
      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Opening secure scheduling…</Text></View> : null}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    webview: { flex: 1, backgroundColor: colors.background },
    notice: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong, backgroundColor: colors.primaryMuted, paddingHorizontal: 16, paddingVertical: 10 },
    noticeText: { flex: 1, color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("medium") },
    loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.background },
    loadingText: { color: colors.mutedForeground, fontSize: 13, ...font("medium") },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, paddingHorizontal: 34 },
    emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    emptyTitle: { color: colors.foreground, fontSize: 24, lineHeight: 30, textAlign: "center", marginTop: 18, ...font("heavy") },
    emptyBody: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 8, ...font("regular") },
  });
}
