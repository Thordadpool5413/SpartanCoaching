import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const SERVICE_OPTIONS = [
  "Virtual Coaching",
  "Team Training",
  "Growth Strategy",
  "Technology Solutions",
  "Other",
];

export default function ContactScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    serviceType: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (key: keyof typeof form, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const isValid =
    form.name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.phone.replace(/\D/g, "").length >= 10 &&
    form.message.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);
    try {
      await apiPost("/api/contact", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company || undefined,
        serviceType: form.serviceType || undefined,
        message: form.message,
        submittedAt: Date.now(),
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.successContainer, { paddingTop: topPad }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.accent }]}>
            <Feather name="check" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Message Sent
          </Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Nick Lynch will be in touch within one business day.
          </Text>
          <Pressable
            onPress={() => {
              setSubmitted(false);
              setForm({ name: "", email: "", phone: "", company: "", serviceType: "", message: "" });
            }}
            style={({ pressed }) => [styles.resetBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={[{ color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Send another message</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Contact
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Get in touch with Spartan Coaching
        </Text>
      </View>

      {/* Bio Card — always dark brand section */}
      <View style={[styles.bioCard, { backgroundColor: colors.heroBackground }]}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.bioLogo}
          resizeMode="contain"
        />
        <View style={styles.bioInfo}>
          <Text style={[styles.bioName, { color: colors.heroForeground, fontFamily: "Inter_700Bold" }]}>
            Nick Lynch
          </Text>
          <Text style={[styles.bioTitle, { color: colors.heroMuted, fontFamily: "Inter_400Regular" }]}>
            Founder, Spartan Coaching
          </Text>
          <Text style={[styles.bioBio, { color: colors.heroMuted, fontFamily: "Inter_400Regular" }]}>
            The Authority in Hospice Excellence. Nick works with hospice sales professionals to build the conversations that get patients the care they deserve.
          </Text>
          <Pressable
            onPress={() => Linking.openURL("https://www.linkedin.com/in/nicklynch")}
            style={({ pressed }) => [styles.linkedinBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Feather name="linkedin" size={16} color={colors.heroBadgeText} />
            <Text style={[styles.linkedinText, { color: colors.heroBadgeText, fontFamily: "Inter_600SemiBold" }]}>
              Connect on LinkedIn
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={[styles.formTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Send a Message
        </Text>

        <View style={styles.formField}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Name *</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
            placeholder="Your full name"
            placeholderTextColor={colors.mutedForeground}
            value={form.name}
            onChangeText={(v) => updateField("name", v)}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formField}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Email *</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedForeground}
            value={form.email}
            onChangeText={(v) => updateField("email", v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formField}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Phone *</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
            placeholder="(555) 555-5555"
            placeholderTextColor={colors.mutedForeground}
            value={form.phone}
            onChangeText={(v) => updateField("phone", v)}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formField}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Organization</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
            placeholder="Your hospice or organization"
            placeholderTextColor={colors.mutedForeground}
            value={form.company}
            onChangeText={(v) => updateField("company", v)}
          />
        </View>

        <View style={styles.formField}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Service Interest</Text>
          <View style={styles.serviceOptions}>
            {SERVICE_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => updateField("serviceType", form.serviceType === opt ? "" : opt)}
                style={({ pressed }) => [
                  styles.serviceBtn,
                  {
                    borderColor: form.serviceType === opt ? colors.primary : colors.border,
                    backgroundColor: form.serviceType === opt ? colors.accent : colors.card,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.serviceBtnText,
                    { color: form.serviceType === opt ? colors.primary : colors.mutedForeground },
                    { fontFamily: form.serviceType === opt ? "Inter_600SemiBold" : "Inter_400Regular" },
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.formField}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Message *</Text>
          <TextInput
            style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
            placeholder="Tell me about your situation and what you're looking to achieve..."
            placeholderTextColor={colors.mutedForeground}
            value={form.message}
            onChangeText={(v) => updateField("message", v)}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {!!error && (
          <View style={[styles.errorCard, { backgroundColor: colors.accent }]}>
            <Text style={[styles.errorText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>{error}</Text>
          </View>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={!isValid || loading}
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: colors.primary },
            (!isValid || loading) && { opacity: 0.5 },
            isValid && !loading && pressed && { opacity: 0.85 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <>
              <Text style={[styles.submitBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                Send Message
              </Text>
              <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  bioCard: {
    flexDirection: "row",
    gap: 16,
    padding: 20,
    alignItems: "flex-start",
  },
  bioLogo: { width: 52, height: 52, borderRadius: 8 },
  bioInfo: { flex: 1 },
  bioName: { fontSize: 18, fontWeight: "700" },
  bioTitle: { fontSize: 13, marginTop: 2 },
  bioBio: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  linkedinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  linkedinText: { fontSize: 14 },
  form: { padding: 20 },
  formTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  formField: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 120,
  },
  serviceOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  serviceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  serviceBtnText: { fontSize: 13 },
  errorCard: { borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 14 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  submitBtnText: { fontSize: 17, fontWeight: "700" },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  successBody: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  resetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
});
