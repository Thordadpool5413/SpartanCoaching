import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";

const CATEGORIES = ["Access or sign in", "Apple membership", "Coach or tools", "Technical issue", "Privacy question"] as const;

export default function SupportScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const [name, setName] = useState(user?.member.name || "");
  const [email, setEmail] = useState(user?.member.email || "");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Technical issue");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const valid = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email) && message.trim().length >= 10;

  const submit = async () => {
    if (!valid || pending) return;
    setPending(true);
    setError(null);
    try {
      await apiPost("/api/inquiries", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: user?.organization?.name || undefined,
        serviceType: `App Support: ${category}`,
        message: `Support category: ${category}\n\n${message.trim()}\n\nNo patient PHI was requested or provided.`,
        submittedAt: Date.now(),
      });
      setSubmitted(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Support could not receive this request. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.confirmation} testID="support-confirmation">
        <View style={styles.success}><Feather name="check" size={27} color="#FFFFFF" /></View>
        <Text style={styles.kicker}>REQUEST RECEIVED</Text>
        <Text style={styles.title}>Support has the right context.</Text>
        <Text style={styles.body}>Your {category.toLowerCase()} request was submitted inside the app. A response can be sent to {email.trim()}.</Text>
        <SpartanButton title="Send another request" variant="outline" onPress={() => { setSubmitted(false); setMessage(""); }} />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      testID="screen-native-support"
    >
      <View style={styles.heroIcon}><Feather name="life-buoy" size={25} color={colors.primary} /></View>
      <Text style={styles.kicker}>APP SUPPORT</Text>
      <Text style={styles.title}>Tell us what is getting in your way.</Text>
      <Text style={styles.body}>Choose the closest issue and include enough detail to reproduce it. Keep patient information out of the request.</Text>

      <Text style={styles.label}>What needs help?</Text>
      <View style={styles.categoryWrap} accessibilityRole="radiogroup">
        {CATEGORIES.map((item) => {
          const selected = item === category;
          return (
            <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => { setCategory(item); void Haptics.selectionAsync(); }} style={[styles.category, selected && styles.categorySelected]}>
              <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <SupportField label="Name" value={name} onChangeText={setName} placeholder="Your full name" autoCapitalize="words" />
      <SupportField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
      <SupportField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="(555) 555 5555" keyboardType="phone-pad" />
      <View style={styles.field}>
        <Text style={styles.label}>What happened?</Text>
        <TextInput value={message} onChangeText={setMessage} placeholder="What were you trying to do, what did you expect, and what happened instead? Do not include patient PHI." placeholderTextColor={colors.mutedForeground} multiline textAlignVertical="top" style={styles.textarea} />
      </View>
      <View style={styles.privacy}><Feather name="shield" size={18} color={colors.primary} /><Text style={styles.privacyText}>Never include patient names, dates of birth, medical record numbers, contact information, or clinical documents.</Text></View>
      {error ? <Text accessibilityRole="alert" selectable style={styles.error}>{error}</Text> : null}
      <SpartanButton title="Send support request" onPress={() => void submit()} loading={pending} disabled={!valid} />
    </KeyboardAwareScrollViewCompat>
  );
}

function SupportField(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput {...props} placeholderTextColor={colors.mutedForeground} style={styles.input} /></View>;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 44, gap: 14 },
    heroIcon: { width: 58, height: 58, borderRadius: 19, borderCurve: "continuous", backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    kicker: { color: colors.primary, fontSize: 10, letterSpacing: 2, ...font("bold") },
    title: { color: colors.foreground, fontSize: 31, lineHeight: 36, letterSpacing: -0.8, ...font("heavy") },
    body: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, ...font("regular") },
    label: { color: colors.foreground, fontSize: 13, ...font("bold") },
    categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    category: { minHeight: 44, justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 999, paddingHorizontal: 13, backgroundColor: colors.card },
    categorySelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
    categoryText: { color: colors.mutedForeground, fontSize: 12, ...font("semibold") },
    categoryTextSelected: { color: colors.primary },
    field: { gap: 7 },
    input: { minHeight: 52, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 15, borderCurve: "continuous", paddingHorizontal: 14, backgroundColor: colors.card, color: colors.foreground, fontSize: 15, ...font("regular") },
    textarea: { minHeight: 150, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 17, borderCurve: "continuous", padding: 14, backgroundColor: colors.card, color: colors.foreground, fontSize: 15, lineHeight: 22, ...font("regular") },
    privacy: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: 15, borderCurve: "continuous", backgroundColor: colors.primaryMuted, padding: 13 },
    privacyText: { flex: 1, color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("medium") },
    error: { color: colors.destructive, fontSize: 12, lineHeight: 18, ...font("semibold") },
    confirmation: { flex: 1, justifyContent: "center", paddingHorizontal: 26, gap: 14, backgroundColor: colors.background },
    success: { width: 58, height: 58, borderRadius: 19, borderCurve: "continuous", backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  });
}
