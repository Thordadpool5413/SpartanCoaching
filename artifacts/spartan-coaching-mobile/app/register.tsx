import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { SpartanInput } from "@/components/ui/SpartanInput";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import {
  APP_STORE_PRIVACY_URL,
  APP_STORE_TERMS_URL,
} from "@/lib/appStoreReadiness";
import { ApiError } from "@/lib/api";
import { font } from "@/lib/typography";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register, isAuthenticated, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [noPhi, setNoPhi] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/(tabs)/account");
  }, [isAuthenticated, isLoading]);

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) return setError("Enter your full name.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must contain at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (!accepted) return setError("Accept the Terms and Privacy Policy to continue.");
    if (!noPhi) return setError("Confirm that you will not enter patient PHI.");
    setPending(true);
    try {
      await register({ name, email, password });
      router.replace("/(tabs)/account");
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : "Account creation failed";
      const status = caught instanceof ApiError ? caught.status : undefined;
      setError(status === 409 ? "An account with this email already exists. Sign in instead." : message.slice(0, 180));
    } finally {
      setPending(false);
    }
  };

  const canSubmit = Boolean(
    name.trim().length >= 2 &&
      email.trim() &&
      password.length >= 8 &&
      confirmPassword &&
      accepted &&
      noPhi,
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 36 }}
      >
        <View style={styles.frame}>
          <Text style={[styles.kicker, { color: colors.primary }, font("bold")]}>INDIVIDUAL MEMBERSHIP</Text>
          <Text style={[styles.title, { color: colors.foreground }, font("heavy")]}>Build your field advantage.</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }, font("regular")]}>Create one private Spartan Coaching account, then choose Standard or Elite through Apple.</Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderStrong ?? colors.border }]}>
            <SpartanInput label="Full name" autoComplete="name" value={name} onChangeText={setName} placeholder="Your name" />
            <SpartanInput label="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} placeholder="you@company.com" />
            <SpartanInput label="Password" secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" />
            <SpartanInput label="Confirm password" secureTextEntry autoComplete="new-password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Enter it again" />

            <ConsentRow
              checked={accepted}
              onPress={() => setAccepted((value) => !value)}
              label="I agree to the Terms of Service and Privacy Policy."
              colors={colors}
              testID="register-accept-terms"
            />
            <View style={styles.legalLinks}>
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(APP_STORE_TERMS_URL)}><Text style={[styles.legalLink, { color: colors.primary }, font("semibold")]}>Terms</Text></Pressable>
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(APP_STORE_PRIVACY_URL)}><Text style={[styles.legalLink, { color: colors.primary }, font("semibold")]}>Privacy Policy</Text></Pressable>
            </View>
            <ConsentRow
              checked={noPhi}
              onPress={() => setNoPhi((value) => !value)}
              label="I will not enter patient names, dates of birth, record numbers, contact details, documents, or other PHI."
              colors={colors}
              testID="register-confirm-no-phi"
            />

            {error ? (
              <Text
                accessibilityRole="alert"
                style={[styles.formError, { color: colors.destructive }, font("semibold")]}
              >
                {error}
              </Text>
            ) : null}

            <SpartanButton title="Create secure account" onPress={() => void submit()} loading={pending} disabled={!canSubmit || pending} testID="button-register" />
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.replace("/login")} style={styles.signIn}>
            <Text style={[styles.signInText, { color: colors.primary }, font("bold")]}>Already a member? Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ConsentRow({
  checked,
  onPress,
  label,
  colors,
  testID,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
  colors: ReturnType<typeof useColors>;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={styles.consent}
      testID={testID}
    >
      <View style={[styles.checkbox, { borderColor: checked ? colors.primary : colors.borderStrong ?? colors.border, backgroundColor: checked ? colors.primary : "transparent" }]}>
        {checked ? <Feather name="check" size={15} color={colors.primaryForeground} /> : null}
      </View>
      <Text style={[styles.consentText, { color: colors.foreground }, font("regular")]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  frame: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 20 },
  kicker: { fontSize: 11, letterSpacing: 2.1, marginTop: 10 },
  title: { fontSize: 36, lineHeight: 40, letterSpacing: -1.1, marginTop: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 9, marginBottom: 22 },
  card: { borderWidth: 1, borderRadius: 22, padding: 20, gap: 4 },
  consent: { minHeight: 52, flexDirection: "row", alignItems: "flex-start", gap: 11, paddingVertical: 9 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  consentText: { flex: 1, fontSize: 13, lineHeight: 19 },
  legalLinks: { flexDirection: "row", gap: 18, marginLeft: 35, marginTop: -7, marginBottom: 4 },
  legalLink: { fontSize: 12 },
  formError: { fontSize: 13, lineHeight: 18, marginTop: 4, marginBottom: 8 },
  signIn: { minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 8 },
  signInText: { fontSize: 14 },
});
