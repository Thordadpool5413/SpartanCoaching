import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCoachSession } from "@/lib/CoachSessionContext";
import { font } from "@/lib/typography";

export function VoiceActivityBanner() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isVoiceActive, audioLevel } = useCoachSession();
  if (!isVoiceActive) return null;

  return (
    <SafeAreaView edges={["top"]} pointerEvents="none" style={styles.safe}>
      <View style={styles.banner} accessibilityLiveRegion="polite">
        <Feather name="mic" size={16} color={colors.primaryForeground} />
        <Text style={styles.text}>Coach is listening</Text>
        <View style={[styles.level, { opacity: 0.35 + Math.min(1, Math.max(0, audioLevel)) * 0.65 }]} />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { alignItems: "center", left: 0, position: "absolute", right: 0, top: 0, zIndex: 1000 },
    banner: { alignItems: "center", backgroundColor: colors.foreground, borderRadius: 999, flexDirection: "row", gap: 8, marginTop: 6, paddingHorizontal: 14, paddingVertical: 9 },
    text: { color: colors.background, fontSize: 13, ...font("semibold") },
    level: { backgroundColor: colors.primary, borderRadius: 999, height: 7, width: 7 },
  });
}
