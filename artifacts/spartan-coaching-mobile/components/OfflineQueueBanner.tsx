import React, { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import {
  flushGenerateQueue,
  flushNeedsReauth,
  listQueuedGenerates,
  type QueuedGenerate,
} from "@/lib/offlineQueue";
import { radius } from "@/lib/spacing";

/**
 * Shows when tool generates are queued offline; tap to retry flush.
 * AI generation itself is never offline — only the retry queue is durable.
 */
export function OfflineQueueBanner() {
  const colors = useColors();
  const [queue, setQueue] = useState<QueuedGenerate[]>([]);
  const [flushing, setFlushing] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  const reload = useCallback(async () => {
    setQueue(await listQueuedGenerates());
  }, []);

  useEffect(() => {
    void reload();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        void reload();
        // Auto-flush when returning to foreground (weak network recovery)
        void flushGenerateQueue().then((r) => {
          setNeedsReauth(flushNeedsReauth(r));
          return reload();
        });
      }
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
      const result = await flushGenerateQueue();
      setNeedsReauth(flushNeedsReauth(result));
      await reload();
    } finally {
      setFlushing(false);
    }
  };

  const subtitle = flushing
    ? "Retrying…"
    : needsReauth
      ? "Sign in again from Account, then tap to retry. AI needs the network."
      : "AI needs the internet. Tap to retry when you have signal.";

  return (
    <Pressable
      onPress={onRetry}
      style={[styles.bar, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
      testID="offline-queue-banner"
      accessibilityRole="button"
      accessibilityLabel={`${queue.length} tools queued for retry. ${subtitle}`}
      accessibilityState={{ busy: flushing }}
    >
      <Feather name={needsReauth ? "log-in" : "cloud-off"} size={16} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[{ color: colors.foreground, fontSize: 13 }, font("bold")]}>
          {queue.length} tool{queue.length === 1 ? "" : "s"} waiting to retry
        </Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }, font("regular")]}>
          {subtitle}
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
