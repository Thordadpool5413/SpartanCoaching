import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { SpartanInput } from "@/components/ui/SpartanInput";
import { SpartanCard } from "@/components/ui/SpartanCard";
import { font } from "@/lib/typography";

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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign in failed";
      const status = e instanceof ApiError ? e.status : undefined;
      if (status === 401 || msg.toLowerCase().includes("invalid")) {
        setError("Email or password is incorrect.");
      } else if (status === 403) {
        setError(msg.slice(0, 160) || "Set your password from the approval email first.");
      } else if (msg.includes("EXPO_PUBLIC") || msg.includes("Failed to fetch") || msg.includes("Network")) {
        setError("Cannot reach Hospice Sales Pro. Check connection or API configuration.");
      } else {
        setError(msg.replace(/^\d+:\s*/, "").slice(0, 160));
      }
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
        <SectionKicker>Client access</SectionKicker>
        <Text style={[styles.title, { color: colors.foreground }]}>Sign in</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Hospice Sales Pro for clients and approved evaluators — same product as the web, built for the field.
        </Text>

        <SpartanCard style={{ marginTop: 8 }}>
          <SpartanInput
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@hospice.com"
          />
          <SpartanInput
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            error={error}
          />
          <SpartanButton
            title="Sign in"
            onPress={onSubmit}
            loading={pending}
            disabled={!email.trim() || !password}
            style={{ marginTop: 20 }}
            testID="button-login"
          />
        </SpartanCard>

        <Pressable
          onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_API_URL?.replace(/\/api$/, "") ?? "https://spartanhospicecoaching.com"}/register`)}
          style={{ marginTop: 20 }}
          testID="button-create-account"
        >
          <Text style={[{ color: colors.primary, textAlign: "center" }, font("semibold")]}>
            New? Create an account →
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/contact")} style={{ marginTop: 12 }}>
          <Text style={[{ color: colors.mutedForeground, textAlign: "center" }, font("regular")]}>
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
  title: {
    fontSize: 32,
    marginTop: 8,
    marginBottom: 8,
    letterSpacing: -0.4,
    ...font("heavy"),
  },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: 20, ...font("regular") },
});