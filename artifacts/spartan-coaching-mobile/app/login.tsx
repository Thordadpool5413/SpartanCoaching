import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, type Href, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { SpartanInput } from "@/components/ui/SpartanInput";
import { font } from "@/lib/typography";
import { HelmetMark } from "@/components/brand/HelmetMark";
import {
  parseLoginReturnTarget,
  requiresFieldKitTarget,
  targetToHref,
} from "@/lib/deepLinks";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, isLoading, canUseFieldKit } = useAuth();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const loginReturnTarget = useMemo(() => parseLoginReturnTarget(next), [next]);
  const postLoginTarget = useCallback(() => {
    if (loginReturnTarget && (!requiresFieldKitTarget(loginReturnTarget) || canUseFieldKit)) {
      return targetToHref(loginReturnTarget);
    }
    return (canUseFieldKit ? "/(tabs)" : "/(tabs)/account") as Href;
  }, [canUseFieldKit, loginReturnTarget]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(postLoginTarget());
  }, [isLoading, isAuthenticated, postLoginTarget]);

  const onSubmit = async () => {
    setError(null);
    setPending(true);
    try {
      await login(email.trim(), password);
      router.replace(postLoginTarget());
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : "Sign in failed";
      const status = caught instanceof ApiError ? caught.status : undefined;
      if (status === 401 || message.toLowerCase().includes("invalid")) {
        setError("Email or password is incorrect.");
      } else if (status === 403) {
        setError(message.slice(0, 160) || "Finish account setup from your approval email first.");
      } else if (message.includes("EXPO_PUBLIC") || message.includes("Failed to fetch") || message.includes("Network")) {
        setError("Spartan Coaching cannot be reached. Check your connection and try again.");
      } else {
        setError(message.replace(/^\d+:\s*/, "").slice(0, 160));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28 }}
      >
        <View style={styles.frame}>
          <View style={[styles.brandPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <HelmetMark size={92} />
            <Text style={[styles.brandName, { color: colors.foreground }, font("heavy")]}>SPARTAN COACHING</Text>
            <Text style={[styles.brandLine, { color: colors.primary }, font("bold")]}>FIELD INTELLIGENCE FOR HOSPICE GROWTH</Text>
          </View>

          <View style={styles.heading}>
            <Text style={[styles.kicker, { color: colors.primary }, font("bold")]}>MEMBER ACCESS</Text>
            <Text style={[styles.title, { color: colors.foreground }, font("heavy")]}>Return to the work.</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }, font("regular")]}>One private account across your iPhone and the Spartan Coaching website.</Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.borderStrong ?? colors.border }]}>
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
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              error={error}
              onSubmitEditing={() => {
                if (email.trim() && password && !pending) void onSubmit();
              }}
            />
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/forgot-password" as Href)}
              style={styles.forgot}
              testID="button-forgot-password"
            >
              <Text style={[styles.forgotText, { color: colors.primary }, font("semibold")]}>Forgot password</Text>
            </Pressable>
            <SpartanButton
              title="Sign in securely"
              onPress={() => void onSubmit()}
              loading={pending}
              disabled={!email.trim() || !password}
              testID="button-login"
            />
            <View style={[styles.trustRow, { borderTopColor: colors.border }]}>
              <Feather name="lock" size={14} color={colors.mutedForeground} />
              <Text style={[styles.trustText, { color: colors.mutedForeground }, font("regular")]}>Private account access. Coach conversations stay private unless you share a summary or commitment.</Text>
            </View>
          </View>

          <View style={styles.secondaryActions}>
            <View style={[styles.recoveryCard, { backgroundColor: colors.card, borderColor: colors.borderStrong ?? colors.border }]} testID="company-offboarding-recovery">
              <Feather name="refresh-cw" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.recoveryTitle, { color: colors.foreground }, font("bold")]}>Company access ended?</Text>
                <Text style={[styles.recoveryBody, { color: colors.mutedForeground }, font("regular")]}>Choose individual access through Apple, then create the personal account with the same email. Preserved private commitments can reconnect during the 30 day recovery window.</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/membership" as Href)}
              style={[styles.linkButton, { borderColor: colors.borderStrong ?? colors.border }]}
              testID="button-choose-membership"
            >
              <Text style={[styles.linkButtonText, { color: colors.foreground }, font("bold")]}>Choose a membership</Text>
              <Feather name="arrow-right" size={18} color={colors.primary} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push("/register" as Href)} style={styles.contactLink} testID="button-create-account">
              <Text style={[styles.contactText, { color: colors.primary }, font("semibold")]}>Create an account for an existing Apple purchase</Text>
              <Feather name="chevron-right" size={17} color={colors.primary} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/contact")} style={styles.contactLink}>
              <Text style={[styles.contactText, { color: colors.mutedForeground }, font("semibold")]}>Company team or consulting access</Text>
              <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  frame: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20 },
  brandPanel: {
    minHeight: 192,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  brandName: { fontSize: 14, letterSpacing: 2.6, marginTop: 14 },
  brandLine: { fontSize: 8, letterSpacing: 1.9, marginTop: 6 },
  heading: { paddingHorizontal: 4, paddingTop: 32, paddingBottom: 20, gap: 8 },
  kicker: { fontSize: 11, letterSpacing: 2.2 },
  title: { fontSize: 38, lineHeight: 41, letterSpacing: -1.3 },
  subtitle: { fontSize: 15, lineHeight: 22, maxWidth: 420 },
  formCard: { borderWidth: 1, borderRadius: 22, padding: 20, gap: 2 },
  forgot: { alignSelf: "flex-end", minHeight: 44, justifyContent: "center", marginTop: -4 },
  forgotText: { fontSize: 13 },
  trustRow: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 18, paddingTop: 16 },
  trustText: { flex: 1, fontSize: 11, lineHeight: 17 },
  secondaryActions: { paddingTop: 14, gap: 4 },
  recoveryCard: { minHeight: 88, flexDirection: "row", alignItems: "flex-start", gap: 11, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 6 },
  recoveryTitle: { fontSize: 13 },
  recoveryBody: { fontSize: 11, lineHeight: 17, marginTop: 3 },
  linkButton: { minHeight: 56, borderWidth: 1, borderRadius: 16, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  linkButtonText: { fontSize: 14 },
  contactLink: { minHeight: 50, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  contactText: { fontSize: 13 },
});
