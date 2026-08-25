import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { SpartanInput } from "@/components/ui/SpartanInput";
import { useColors } from "@/hooks/useColors";
import { requestPasswordResetMobile } from "@/lib/api";
import { font } from "@/lib/typography";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setPending(true); setError(null);
    try { await requestPasswordResetMobile(email); setSent(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The reset request could not be sent."); }
    finally { setPending(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.content}>
        <View style={styles.icon}><Feather name={sent ? "mail" : "key"} size={26} color={colors.primary} /></View>
        <Text style={styles.kicker}>SECURE ACCOUNT RECOVERY</Text>
        <Text style={styles.title}>{sent ? "Check your email." : "Reset your password."}</Text>
        <Text style={styles.body}>{sent ? "If a Spartan account exists for that address, we sent a one-hour reset link. Open it on this iPhone to continue." : "Enter the email used for your Spartan account. We will send a secure one-hour reset link."}</Text>
        {!sent ? <SpartanInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@hospice.com" error={error} /> : null}
        {!sent ? <SpartanButton title="Send secure reset link" onPress={() => void send()} loading={pending} disabled={!email.trim()} /> : <SpartanButton title="Return to sign in" onPress={() => router.replace("/login" as any)} />}
        <View style={styles.trust}><Feather name="shield" size={16} color={colors.primary} /><Text style={styles.trustText}>For privacy, we do not reveal whether an email address has an account.</Text></View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { flex: 1, justifyContent: "center", padding: 24, gap: 14 },
  icon: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
  kicker: { color: colors.primary, fontSize: 10, letterSpacing: 2, ...font("bold") }, title: { color: colors.foreground, fontSize: 34, lineHeight: 39, letterSpacing: -1, ...font("heavy") },
  body: { color: colors.mutedForeground, fontSize: 15, lineHeight: 23, marginBottom: 6, ...font("regular") },
  trust: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: colors.primaryMuted, borderRadius: 15, padding: 13, marginTop: 4 },
  trustText: { color: colors.mutedForeground, flex: 1, fontSize: 11, lineHeight: 17, ...font("regular") },
}); }
