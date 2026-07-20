import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, canUseFieldKit, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(canUseFieldKit ? "/(tabs)" : "/(tabs)/contact");
    }
  }, [isLoading, isAuthenticated, canUseFieldKit]);

  const onSubmit = async () => {
    setError(null);
    setPending(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message || "Sign in failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={[styles.kicker, { color: colors.primary }]}>CLIENT ACCESS</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Sign in</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Access your private Field Kit on the go.
        </Text>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          placeholderTextColor={colors.mutedForeground}
          placeholder="you@hospice.com"
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          placeholderTextColor={colors.mutedForeground}
          placeholder="••••••••"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={onSubmit}
          disabled={pending}
          style={[styles.btn, { backgroundColor: colors.primary, opacity: pending ? 0.7 : 1 }]}
        >
          {pending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign in</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push("/(tabs)/contact")} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary, textAlign: "center", fontWeight: "600" }}>
            Prefer a strategy call? Contact us
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { paddingHorizontal: 24, maxWidth: 480, width: "100%", alignSelf: "center" },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: "900", marginBottom: 8 },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  btn: {
    marginTop: 24,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  error: { color: "#ef4444", marginTop: 12, fontSize: 14 },
});
