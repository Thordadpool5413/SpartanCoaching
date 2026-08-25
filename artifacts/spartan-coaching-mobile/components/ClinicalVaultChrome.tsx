import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { fetchJurisdictionContext, type JurisdictionContext } from "@/lib/jurisdictionApi";
import { VAULT, VAULT_COPY } from "@/lib/clinicalVaultTheme";

export function ClinicalVaultHubBanner() {
  const colors = useColors();
  return (
    <View
      style={[styles.hub, { borderColor: VAULT.border, backgroundColor: VAULT.surface }]}
      accessibilityRole="summary"
    >
      <View style={[styles.iconWell, { backgroundColor: VAULT.surfaceStrong }]}>
        <Feather name="shield" size={20} color={VAULT.accent} />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={[{ color: colors.foreground, fontSize: 18 }, font("bold")]}>{VAULT_COPY.hubTitle}</Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 14, lineHeight: 21 }, font("regular")]}>{VAULT_COPY.hubBody}</Text>
        <View style={styles.chips}>
          {VAULT_COPY.chips.map((chip) => (
            <View key={chip} style={[styles.chip, { borderColor: VAULT.borderSubtle, backgroundColor: colors.background }]}>
              <Text style={[{ color: colors.foreground, fontSize: 10 }, font("semibold")]}>{chip.toUpperCase()}</Text>
            </View>
          ))}
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
      .then((context) => {
        if (!cancelled) setJurisdiction(context);
      })
      .catch(() => {
        if (!cancelled) setJurisdiction(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  const ready = Boolean(jurisdiction?.state && jurisdiction?.macRegion);

  return (
    <View style={[styles.toolBanner, { borderColor: VAULT.border, backgroundColor: VAULT.surface }]} accessibilityRole="summary">
      <Feather name="shield" size={18} color={VAULT.accent} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={[{ color: colors.foreground, fontSize: 14 }, font("bold")]}>{VAULT_COPY.toolBannerTitle}</Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }, font("regular")]}>{VAULT_COPY.toolBannerBody}</Text>
        {loaded ? (
          <View style={[styles.jurisdiction, { borderTopColor: VAULT.borderSubtle }]} testID="clinical-jurisdiction-state">
            <View style={[styles.statusDot, { backgroundColor: ready ? colors.success : colors.destructive }]} />
            <View style={{ flex: 1 }}>
              <Text style={[{ color: colors.foreground, fontSize: 11 }, font("bold")]}>{ready ? "Jurisdiction context ready" : "Jurisdiction context required"}</Text>
              <Text style={[{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15 }, font("regular")]}>{ready ? `${jurisdiction!.state} · ${jurisdiction!.macRegion}` : "Set your state and Medicare Administrative Contractor region before running clinical education tools."}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push("/jurisdiction" as any)} style={styles.contextButton}>
              <Text style={[{ color: VAULT.accent, fontSize: 10 }, font("bold")]}>{ready ? "Edit" : "Set"}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ClinicalVaultBadge() {
  return (
    <View style={[styles.badge, { borderColor: VAULT.border }]}>
      <Feather name="shield" size={12} color={VAULT.accent} />
      <Text style={[{ color: VAULT.text, fontSize: 12 }, font("semibold")]}>{VAULT_COPY.badge}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hub: {
    borderWidth: 1,
    borderRadius: 16,
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  chip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toolBanner: {
    borderWidth: 1,
    borderRadius: 12,
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
    backgroundColor: VAULT.surface,
  },
});
