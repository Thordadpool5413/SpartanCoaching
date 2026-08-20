import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { SpartanInput } from "@/components/ui/SpartanInput";
import { useColors } from "@/hooks/useColors";
import { resetPasswordMobile } from "@/lib/api";
import { font } from "@/lib/typography";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!token) { setError("This reset link is missing its secure token."); return; }
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setPending(true); setError(null);
    try { await resetPasswordMobile({ token, password }); setDone(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Password could not be reset."); }
    finally { setPending(false); }
  };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}><View style={styles.content}>
    <View style={styles.icon}><Feather name={done ? "check" : "lock"} size={26} color={colors.primary} /></View>
    <Text style={styles.kicker}>SPARTAN ACCOUNT</Text><Text style={styles.title}>{done ? "Password updated." : "Choose a new password."}</Text>
    <Text style={styles.body}>{done ? "Your account is protected. Sign in to return to your membership and saved work." : "Use at least 8 characters. Your membership and history will stay attached to the same account."}</Text>
    {!done ? <><SpartanInput label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="At least 8 characters" /><SpartanInput label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" placeholder="Enter it again" error={error} /><SpartanButton title="Update password" onPress={() => void save()} loading={pending} /></> : <SpartanButton title="Sign in" onPress={() => router.replace("/login" as any)} />}
  </View></KeyboardAvoidingView>;
}

function makeStyles(colors: ReturnType<typeof useColors>) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { flex: 1, justifyContent: "center", padding: 24, gap: 14 },
  icon: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
  kicker: { color: colors.primary, fontSize: 10, letterSpacing: 2, ...font("bold") }, title: { color: colors.foreground, fontSize: 34, lineHeight: 39, letterSpacing: -1, ...font("heavy") },
  body: { color: colors.mutedForeground, fontSize: 15, lineHeight: 23, marginBottom: 6, ...font("regular") },
}); }
