import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { fetchJurisdictionContext, saveJurisdictionContext } from "@/lib/jurisdictionApi";
import { font } from "@/lib/typography";

export default function JurisdictionScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [state, setState] = useState("");
  const [macRegion, setMacRegion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchJurisdictionContext()
      .then((context) => {
        if (cancelled) return;
        setState(context.state || "");
        setMacRegion(context.macRegion || "");
      })
      .catch(() => {
        if (!cancelled) setMessage("Jurisdiction context could not be loaded. Check your connection and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    if (state.trim().length < 2 || macRegion.trim().length < 2) {
      setMessage("Enter both your state and Medicare Administrative Contractor region before using jurisdiction aware clinical education tools.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const result = await saveJurisdictionContext({
        state: state.trim(),
        macRegion: macRegion.trim(),
      });
      setState(result.state || "");
      setMacRegion(result.macRegion || "");
      setMessage("Jurisdiction context saved.");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Jurisdiction context could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 34 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      testID="screen-jurisdiction"
    >
      <View style={styles.hero}>
        <BrandStamp width={150} height={88} />
        <Text style={styles.heroKicker}>CLINICAL CONTEXT</Text>
        <Text style={styles.heroTitle}>Jurisdiction matters.</Text>
        <Text style={styles.heroBody}>Clinical education can vary by state and Medicare Administrative Contractor. Spartan Coaching stores this account context so clinical tools can identify the jurisdiction they are meant to support.</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.guardrail}>
          <Feather name="shield" size={19} color={colors.primary} />
          <Text style={styles.guardrailText}>This screen is for jurisdiction preferences only. Do not enter patient names, dates, record numbers, contact information, or any other PHI.</Text>
        </View>

        {loading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 28 }} /> : (
          <>
            <Text style={styles.sectionKicker}>STATE</Text>
            <Text style={styles.sectionTitle}>Where do you primarily work?</Text>
            <Text style={styles.sectionBody}>Enter the full state name. This is account context, not patient location information.</Text>
            <TextInput
              value={state}
              onChangeText={setState}
              placeholder="Florida"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.input}
              accessibilityLabel="Primary state"
            />

            <Text style={styles.sectionKicker}>MEDICARE CONTRACTOR</Text>
            <Text style={styles.sectionTitle}>Which MAC jurisdiction applies?</Text>
            <Text style={styles.sectionBody}>Enter the contractor or jurisdiction label your organization uses. This preference does not replace current source verification or compliance review.</Text>
            <TextInput
              value={macRegion}
              onChangeText={setMacRegion}
              placeholder="MAC contractor or jurisdiction"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.input}
              accessibilityLabel="Medicare Administrative Contractor region"
            />

            <View style={styles.reviewCard}>
              <Feather name="check-circle" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewTitle}>Context is not approval.</Text>
                <Text style={styles.reviewBody}>Spartan Coaching must still use current approved sources. Clinical guidance requires the appropriate medical director and compliance review. Regulatory and operational guidance requires compliance review.</Text>
              </View>
            </View>

            {message ? <Text style={[styles.message, message.includes("saved") && { color: colors.success }]}>{message}</Text> : null}
            <SpartanButton title={saving ? "Saving context…" : "Save jurisdiction context"} onPress={() => void save()} disabled={saving} />
            <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button"><Text style={styles.backText}>Back to Account</Text></Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { gap: 0 },
    hero: { minHeight: 248, backgroundColor: colors.heroBackground, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 28, justifyContent: "flex-end", gap: 7 },
    heroKicker: { color: colors.heroMuted, fontSize: 9, letterSpacing: 2, ...font("bold") },
    heroTitle: { color: colors.heroForeground, fontSize: 31, lineHeight: 36, letterSpacing: -0.8, ...font("heavy") },
    heroBody: { color: colors.heroMuted, fontSize: 13, lineHeight: 20, ...font("regular") },
    body: { paddingHorizontal: 20, paddingTop: 24, gap: 13 },
    guardrail: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.primaryMuted, borderRadius: 16, borderCurve: "continuous", padding: 14 },
    guardrailText: { flex: 1, color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("medium") },
    sectionKicker: { color: colors.primary, fontSize: 9, letterSpacing: 1.7, marginTop: 8, ...font("bold") },
    sectionTitle: { color: colors.foreground, fontSize: 22, lineHeight: 27, ...font("heavy") },
    sectionBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("regular") },
    input: { minHeight: 54, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, color: colors.foreground, borderRadius: 15, borderCurve: "continuous", paddingHorizontal: 14, fontSize: 15, ...font("regular") },
    reviewCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, borderRadius: 17, borderCurve: "continuous", padding: 14, marginTop: 6 },
    reviewTitle: { color: colors.foreground, fontSize: 13, ...font("bold") },
    reviewBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 3, ...font("regular") },
    message: { color: colors.destructive, fontSize: 11, lineHeight: 17, ...font("semibold") },
    backButton: { minHeight: 46, alignItems: "center", justifyContent: "center" },
    backText: { color: colors.primary, fontSize: 12, ...font("bold") },
  });
}
