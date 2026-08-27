import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";
import {
  clearGenerateQueue,
  listQueuedGenerates,
  type QueuedGenerate,
} from "@/lib/offlineQueue";
import { radius } from "@/lib/spacing";

/**
 * Retires queued field requests from earlier app versions. New generated tool
 * input is session-only and is never retried from device storage.
 */
export function OfflineQueueBanner() {
  const colors = useColors();
  const [queue, setQueue] = useState<QueuedGenerate[]>([]);
  const [removedLegacyRequests, setRemovedLegacyRequests] = useState(false);

  const reload = useCallback(async () => {
    const queued = await listQueuedGenerates();
    if (queued.length) {
      await clearGenerateQueue();
      setRemovedLegacyRequests(true);
      setQueue([]);
      return;
    }
    setQueue([]);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!removedLegacyRequests && queue.length === 0) return null;

  return (
    <View
      style={[styles.bar, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
      testID="offline-queue-privacy-notice"
      accessibilityRole="alert"
      accessibilityLabel="Earlier offline requests were removed for privacy."
    >
      <Feather name="shield" size={16} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[{ color: colors.foreground, fontSize: 13 }, font("bold")]}>
          Earlier offline requests were removed
        </Text>
        <Text style={[{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }, font("regular")]}>
          Reconnect and submit again. Your previous input was not sent or saved.
        </Text>
      </View>
    </View>
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
