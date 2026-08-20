import { Feather } from "@expo/vector-icons";
import { reloadAppAsync } from "expo";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch {
      resetError();
    }
  };

  const monoFont = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {__DEV__ && (
        <Pressable
          onPress={() => setIsModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open error details"
          style={({ pressed }) => [
            styles.topButton,
            { top: insets.top + 16, backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="alert-circle" size={20} color={colors.foreground} />
        </Pressable>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Something went wrong</Text>
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          Please reload the app to continue.
        </Text>
        <Pressable
          onPress={handleRestart}
          accessibilityRole="button"
          accessibilityLabel="Reload Spartan Coaching"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              { color: colors.primaryForeground },
              font("semibold"),
            ]}
          >
            Reload app
          </Text>
        </Pressable>
      </View>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text
              style={[
                styles.modalTitle,
                { color: colors.foreground },
                font("semibold"),
              ]}
            >
              Error details
            </Text>
            <Pressable
              onPress={() => setIsModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close error details"
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
            <View style={[styles.errorContainer, { backgroundColor: colors.muted }]}>
              <Text style={[styles.errorText, { color: colors.foreground, fontFamily: monoFont }]}>
                {`Error: ${error.message}\n\n${error.stack || ""}`}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  topButton: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    zIndex: 10,
  },
  content: { alignItems: "center", paddingHorizontal: 32 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  message: { fontSize: 16, textAlign: "center", marginBottom: 24 },
  button: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  buttonText: { fontSize: 16, fontWeight: "600" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 18 },
  modalScrollView: { flex: 1 },
  modalScrollContent: { padding: 16 },
  errorContainer: { borderRadius: 8, overflow: "hidden", padding: 16 },
  errorText: { fontSize: 12, lineHeight: 18 },
});
