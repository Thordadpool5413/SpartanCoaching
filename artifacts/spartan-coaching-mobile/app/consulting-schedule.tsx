import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { WebView } from "react-native-webview";
import { useColors } from "@/hooks/useColors";
import {
  CONSULTATION_BOOKING_EVENT,
  CONSULTATION_BOOKING_OUTCOME,
  getCalendlyConsultationUrl,
  trackConsultationBookingEvent,
} from "@/lib/consultingBookings";
import { fetchClientConfig, getCachedClientConfig } from "@/lib/clientConfig";
import { font } from "@/lib/typography";

export default function ConsultingScheduleScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [booked, setBooked] = useState(false);
  const [clientConfigResolved, setClientConfigResolved] = useState(false);
  const fallbackTracked = useRef(false);
  const failureTracked = useRef(false);
  const url = clientConfigResolved ? getCalendlyConsultationUrl() : null;

  useEffect(() => {
    let mounted = true;
    void fetchClientConfig().then(() => {
      if (mounted) setClientConfigResolved(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const trackFallback = (outcome: string) => {
    if (fallbackTracked.current) return;
    fallbackTracked.current = true;
    trackConsultationBookingEvent("consultation_booking_fallback", outcome);
  };

  const showFallback = (outcome: string) => {
    setLoading(false);
    setFailed(true);
    trackFallback(outcome);
  };

  useEffect(() => {
    if (clientConfigResolved && !url) {
      trackFallback(CONSULTATION_BOOKING_OUTCOME.fallbackDisabled);
      return;
    }
    if (!clientConfigResolved || !url) return;
    trackConsultationBookingEvent(
      CONSULTATION_BOOKING_EVENT.click,
      CONSULTATION_BOOKING_OUTCOME.click,
    );
  }, [clientConfigResolved, url]);

  if (!clientConfigResolved) {
    return (
      <View style={styles.empty} testID="consulting-schedule-loading">
        <ActivityIndicator color={colors.readablePrimary} />
        <Text style={styles.loadingText}>Checking scheduling availability…</Text>
      </View>
    );
  }

  if (!url || failed) {
    return (
      <View style={styles.empty} testID="consulting-schedule-unavailable">
        <View style={styles.emptyIcon}><Feather name="calendar" size={25} color={colors.readablePrimary} /></View>
        <Text style={styles.emptyTitle}>Scheduling is temporarily unavailable</Text>
        <Text style={styles.emptyBody}>Your Access Desk request is still saved. Spartan Coaching will confirm an exact time directly.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to consulting request"
          onPress={() => router.back()}
          style={styles.returnButton}
          testID="consulting-schedule-return"
        >
          <Text style={styles.returnButtonText}>Return to consulting</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="consulting-schedule">
      <View style={styles.notice}>
        <Feather name="shield" size={16} color={colors.readablePrimary} />
        <Text style={styles.noticeText}>Choose an exact time through Calendly. Do not enter patient PHI.</Text>
      </View>
      <WebView
        source={{ uri: url }}
        testID="consulting-schedule-webview"
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          if (!failureTracked.current) {
            failureTracked.current = true;
            trackConsultationBookingEvent(
              CONSULTATION_BOOKING_EVENT.failure,
              CONSULTATION_BOOKING_OUTCOME.failureWebView,
            );
          }
          showFallback(CONSULTATION_BOOKING_OUTCOME.failureWebView);
        }}
        onHttpError={() => {
          if (!failureTracked.current) {
            failureTracked.current = true;
            trackConsultationBookingEvent(
              CONSULTATION_BOOKING_EVENT.failure,
              CONSULTATION_BOOKING_OUTCOME.failureHttp,
            );
          }
          showFallback(CONSULTATION_BOOKING_OUTCOME.failureHttp);
        }}
        onShouldStartLoadWithRequest={(request) => request.url.startsWith("https://")}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
        style={styles.webview}
      />
      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.readablePrimary} /><Text style={styles.loadingText}>Opening secure scheduling…</Text></View> : null}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="I booked a time"
          onPress={() => {
            setBooked(true);
            trackConsultationBookingEvent(
              CONSULTATION_BOOKING_EVENT.success,
              CONSULTATION_BOOKING_OUTCOME.success,
            );
          }}
          style={styles.successButton}
          testID="consulting-schedule-booked"
        >
          <Text style={styles.successButtonText}>I booked a time</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Use Access Desk instead"
          onPress={() => {
            trackFallback(CONSULTATION_BOOKING_OUTCOME.fallbackSelected);
            router.back();
          }}
          style={styles.fallbackButton}
          testID="consulting-schedule-access-desk"
        >
          <Text style={styles.fallbackButtonText}>Use Access Desk instead</Text>
        </Pressable>
      </View>
      {booked ? <Text style={styles.bookedText} testID="consulting-schedule-booked-status">Booking marked complete. Your Access Desk request remains saved.</Text> : null}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    webview: { flex: 1, backgroundColor: colors.background },
    notice: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong, backgroundColor: colors.primaryMuted, paddingHorizontal: 16, paddingVertical: 10 },
    noticeText: { flex: 1, color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("medium") },
    loading: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.background },
    loadingText: { color: colors.mutedForeground, fontSize: 13, ...font("medium") },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, paddingHorizontal: 34 },
    emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryMuted },
    emptyTitle: { color: colors.foreground, fontSize: 24, lineHeight: 30, textAlign: "center", marginTop: 18, ...font("heavy") },
    emptyBody: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 8, ...font("regular") },
    returnButton: { marginTop: 22, minHeight: 48, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.primary },
    returnButtonText: { color: colors.primaryForeground, fontSize: 14, ...font("bold") },
    actions: { backgroundColor: colors.background, padding: 12, gap: 8 },
    successButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.primary },
    successButtonText: { color: colors.primaryForeground, fontSize: 14, ...font("bold") },
    fallbackButton: { minHeight: 42, alignItems: "center", justifyContent: "center" },
    fallbackButtonText: { color: colors.readablePrimary, fontSize: 13, ...font("semibold") },
    bookedText: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, textAlign: "center", paddingHorizontal: 18, paddingBottom: 8, ...font("medium") },
  });
}
