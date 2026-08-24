import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { fetchJurisdictionContext, type JurisdictionContext } from "@/lib/jurisdictionApi";
import { VAULT, VAULT_COPY } from "@/lib/clinicalVaultTheme";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";

function VaultPulse({ reduceMotion }: { reduceMotion: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [pulse, reduceMotion]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: VAULT.accent, opacity }]}
      pointerEvents="none"
    />
  );
}

export function ClinicalVaultHubBanner() {
  const colors = useColors();
  const { reduceMotion } = useAccessibilityPrefs();

  return (
    <View
      style={[styles.hub, { borderColor: VAULT.border }]}
      accessibilityRole="summary"
      overflow="hidden"
    >
      <VaultPulse reduceMotion={reduceMotion} />
      <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.hubContent]}>
        <View style={[styles.iconWell, { backgroundColor: VAULT.surfaceStrong, borderWidth: 1, borderColor: VAULT.border }]}>
          <Feather name="shield" size={20} color={VAULT.accent} />
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={[{ color: VAULT.privacyFg, fontSize: 18 }, font("bold")]}>{VAULT_COPY.hubTitle}</Text>
          <Text style={[{ color: VAULT.privacyMuted, fontSize: 14, lineHeight: 21 }, font("regular")]}>{VAULT_COPY.hubBody}</Text>
          <View style={styles.chips}>
            {VAULT_COPY.chips.map((chip) => (
              <View key={chip} style={[styles.chip, { borderColor: VAULT.border, backgroundColor: VAULT.surfaceStrong }]}>
                <Text style={[{ color: VAULT.accentSoft, fontSize: 10 }, font("semibold")]}>{chip.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

export function ClinicalVaultToolBanner() {
  const colors = useColors();
  const [jurisdiction, setJurisdiction] = useState<JurisdictionContext | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchJurisdictionContext()
      .then((context) => { if (!cancelled) setJurisdiction(context); })
      .catch(() => { if (!cancelled) setJurisdiction(null); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const ready = Boolean(jurisdiction?.state && jurisdiction?.macRegion);

  return (
    <View style={[styles.toolBanner, { borderColor: VAULT.border, backgroundColor: VAULT.surface }]} accessibilityRole="summary">
      <View style={[styles.toolBannerAccentBar, { backgroundColor: VAULT.accent }]} />
      <View style={styles.toolBannerInner}>
        <View style={[styles.iconWellSm, { backgroundColor: VAULT.surfaceStrong }]}>
          <Feather name="shield" size={16} color={VAULT.accent} />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={[{ color: VAULT.privacyFg, fontSize: 14 }, font("bold")]}>{VAULT_COPY.toolBannerTitle}</Text>
          <Text style={[{ color: VAULT.privacyMuted, fontSize: 13, lineHeight: 19 }, font("regular")]}>{VAULT_COPY.toolBannerBody}</Text>
          {loaded ? (
            <View style={[styles.jurisdiction, { borderTopColor: VAULT.borderSubtle }]} testID="clinical-jurisdiction-state">
              <View style={[styles.statusDot, { backgroundColor: ready ? "#55C795" : "#FF5D63" }]} />
              <View style={{ flex: 1 }}>
                <Text style={[{ color: VAULT.privacyFg, fontSize: 11 }, font("bold")]}>
                  {ready ? "Jurisdiction context ready" : "Jurisdiction context required"}
                </Text>
                <Text style={[{ color: VAULT.privacyMuted, fontSize: 10, lineHeight: 15 }, font("regular")]}>
                  {ready
                    ? `${jurisdiction!.state} · ${jurisdiction!.macRegion}`
                    : "Set your state and MAC region before running clinical tools."}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/jurisdiction" as any)}
                style={styles.contextButton}
              >
                <Text style={[{ color: VAULT.accentSoft, fontSize: 10 }, font("bold")]}>{ready ? "Edit" : "Set"}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function ClinicalVaultBadge() {
  return (
    <View style={[styles.badge, { borderColor: VAULT.border, backgroundColor: VAULT.surface }]}>
      <Feather name="shield" size={12} color={VAULT.accent} />
      <Text style={[{ color: VAULT.accentSoft, fontSize: 12 }, font("semibold")]}>{VAULT_COPY.badge}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hub: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: VAULT.privacyBg,
  },
  hubContent: {
    padding: 16,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWellSm: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  chip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toolBanner: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
  },
  toolBannerAccentBar: {
    width: 4,
  },
  toolBannerInner: {
    flex: 1,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  jurisdiction: {
    minHeight: 52,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
    paddingTop: 9,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  contextButton: { minHeight: 38, minWidth: 44, alignItems: "center", justifyContent: "center" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
