import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { VAULT, VAULT_COPY } from "@/lib/clinicalVaultTheme";

/** Hub banner for the clinical vault section (library index). */
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
        <Text style={[{ color: colors.foreground, fontSize: 18 }, font("bold")]}>
          {VAULT_COPY.hubTitle}
        </Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 14, lineHeight: 21 }, font("regular")]}>
          {VAULT_COPY.hubBody}
        </Text>
        <View style={styles.chips}>
          {VAULT_COPY.chips.map((chip) => (
            <View
              key={chip}
              style={[styles.chip, { borderColor: VAULT.borderSubtle, backgroundColor: colors.background }]}
            >
              <Text style={[{ color: colors.foreground, fontSize: 10 }, font("semibold")]}>
                {chip.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** In-tool calm compliance banner (not a marketing strip). */
export function ClinicalVaultToolBanner() {
  const colors = useColors();
  return (
    <View
      style={[styles.toolBanner, { borderColor: VAULT.border, backgroundColor: VAULT.surface }]}
      accessibilityRole="text"
    >
      <Feather name="shield" size={18} color={VAULT.accent} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[{ color: colors.foreground, fontSize: 14 }, font("bold")]}>
          {VAULT_COPY.toolBannerTitle}
        </Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }, font("regular")]}>
          {VAULT_COPY.toolBannerBody}
        </Text>
      </View>
    </View>
  );
}

export function ClinicalVaultBadge() {
  return (
    <View style={[styles.badge, { borderColor: VAULT.border }]}>
      <Feather name="shield" size={12} color={VAULT.accent} />
      <Text style={[{ color: VAULT.text, fontSize: 12 }, font("semibold")]}>
        {VAULT_COPY.badge}
      </Text>
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
