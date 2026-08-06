import React, { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import { flushGenerateQueue, listQueuedGenerates, type QueuedGenerate } from "@/lib/offlineQueue";
import { radius } from "@/lib/spacing";

/**
 * Shows when tool generates are queued offline; tap to retry flush.
 */
export function OfflineQueueBanner() {
  const colors = useColors();
  const [queue, setQueue] = useState<QueuedGenerate[]>([]);
  const [flushing, setFlushing] = useState(false);

  const reload = useCallback(async () => {
    setQueue(await listQueuedGenerates());
  }, []);

  useEffect(() => {
    void reload();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void reload();
    });
    const t = setInterval(() => void reload(), 15_000);
    return () => {
      sub.remove();
      clearInterval(t);
    };
  }, [reload]);

  if (queue.length === 0) return null;

  const onRetry = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlushing(true);
    try {
      await flushGenerateQueue();
      await reload();
    } finally {
      setFlushing(false);
    }
  };

  return (
    <Pressable
      onPress={onRetry}
      style={[styles.bar, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
      testID="offline-queue-banner"
      accessibilityRole="button"
      accessibilityLabel={`${queue.length} tools queued offline. Tap to retry.`}
      accessibilityState={{ busy: flushing }}
    >
      <Feather name="cloud-off" size={16} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[{ color: colors.foreground, fontSize: 13 }, font("bold")]}>
          {queue.length} tool{queue.length === 1 ? "" : "s"} queued offline
        </Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }, font("regular")]}>
          {flushing ? "Retrying…" : "Tap to retry when you have signal"}
        </Text>
      </View>
      <Feather name="refresh-cw" size={16} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },
});
