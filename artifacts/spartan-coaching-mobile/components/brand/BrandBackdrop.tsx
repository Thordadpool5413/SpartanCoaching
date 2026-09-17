import { StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export function BrandBackdrop() {
  const colors = useColors();
  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={[styles.topWash, { backgroundColor: colors.heroBackground }]} />
      <View style={[styles.signalRule, { backgroundColor: colors.primary }]} />
      <View style={[styles.gridRule, { borderColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, overflow: "hidden" },
  topWash: { position: "absolute", top: 0, left: 0, right: 0, height: 168, opacity: 0.035 },
  signalRule: { position: "absolute", top: 0, left: 20, width: 48, height: 2, opacity: 0.8 },
  gridRule: { position: "absolute", top: 26, left: 20, right: 20, borderTopWidth: StyleSheet.hairlineWidth, opacity: 0.55 },
});
