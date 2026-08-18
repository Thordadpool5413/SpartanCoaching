import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import { apiPost } from "@/lib/api";
import { font } from "@/lib/typography";

const SERVICES = [
  {
    id: "executive",
    title: "Executive Growth Advisory",
    body: "Leadership strategy, growth systems, market positioning, and operating clarity.",
    icon: "compass" as const,
  },
  {
    id: "team",
    title: "Team Coaching & Training",
    body: "Live coaching, field development, manager enablement, and practical sales execution.",
    icon: "users" as const,
  },
  {
    id: "growth",
    title: "Hospice Growth Strategy",
    body: "Territory, referral development, sales process, accountability, and conversion strategy.",
    icon: "trending-up" as const,
  },
  {
    id: "technology",
    title: "Technology & AI Advisory",
    body: "Workflow design, AI enablement, product strategy, and practical adoption for hospice organizations.",
    icon: "cpu" as const,
  },
];

const WINDOWS = ["Morning", "Afternoon", "Evening"] as const;

type Form = {
  name: string;
  email: string;
  phone: string;
  company: string;
  serviceType: string;
  availability: string;
  message: string;
};

const EMPTY_FORM: Form = {
  name: "",
  email: "",
  phone: "",
  company: "",
  serviceType: "",
  availability: "",
  message: "",
};

export default function ConsultingScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof Form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const selectedService = SERVICES.find((service) => service.id === form.serviceType);
  const isValid =
    form.name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.phone.replace(/\D/g, "").length >= 10 &&
    Boolean(form.serviceType) &&
    Boolean(form.availability) &&
    form.message.trim().length >= 10;

  const submit = async () => {
    if (!isValid || loading) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);
    try {
      await apiPost("/api/inquiries", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim() || undefined,
        serviceType: selectedService?.title || form.serviceType,
        message: [
          `Preferred meeting window: ${form.availability}`,
          `Consulting request: ${form.message.trim()}`,
        ].join("\n\n"),
        submittedAt: Date.now(),
      });
      setSubmitted(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Your request could not be sent. Nothing was lost. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.screen, { paddingTop: topPad }]} testID="consulting-confirmation">
        <View style={styles.confirmation}>
          <View style={styles.successIcon}><Feather name="check" size={28} color="#FFFFFF" /></View>
          <Text style={styles.confirmationKicker}>REQUEST RECEIVED</Text>
          <Text style={styles.confirmationTitle}>The next conversation is now in motion.</Text>
          <Text style={styles.confirmationBody}>
            Your {selectedService?.title || "consulting"} request and {form.availability.toLowerCase()} preference were submitted. This is a separate contracted human service and is not part of your Apple subscription.
          </Text>
          <View style={styles.confirmationCard}>
            <SummaryRow label="Service" value={selectedService?.title || "Consulting"} />
            <SummaryRow label="Preferred time" value={form.availability} />
            <SummaryRow label="Contact" value={form.email} />
          </View>
          <SpartanButton title="Done" onPress={() => { setSubmitted(false); setForm(EMPTY_FORM); }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      testID="screen-consulting"
    >
      <View style={[styles.hero, { paddingTop: topPad + 10 }]}>
        <BrandStamp width={150} height={88} />
        <Text style={styles.heroKicker}>HUMAN ADVISORY</Text>
        <Text style={styles.heroTitle}>Bring in a human when the work needs more than software.</Text>
        <Text style={styles.heroBody}>Consulting is a separate contracted service. Review the work, choose the fit, and request a conversation without leaving the app.</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionKicker}>1 · CHOOSE THE WORK</Text>
        <Text style={styles.sectionTitle}>What needs attention?</Text>
        <View style={styles.serviceList}>
          {SERVICES.map((service) => {
            const selected = service.id === form.serviceType;
            return (
              <Pressable
                key={service.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  update("serviceType", service.id);
                  void Haptics.selectionAsync();
                }}
                style={({ pressed }) => [
                  styles.serviceRow,
                  selected && styles.serviceRowSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.serviceIcon, selected && styles.serviceIconSelected]}>
                  <Feather name={service.icon} size={20} color={selected ? "#FFFFFF" : colors.primary} />
                </View>
                <View style={styles.serviceCopy}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceBody}>{service.body}</Text>
                </View>
                <Feather name={selected ? "check-circle" : "circle"} size={20} color={selected ? colors.primary : colors.borderStrong} />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionKicker}>2 · PREFERRED AVAILABILITY</Text>
        <Text style={styles.sectionTitle}>When is a conversation easiest?</Text>
        <Text style={styles.sectionBody}>Choose a broad window. Scheduling is confirmed after the request is reviewed.</Text>
        <View style={styles.windowRow} accessibilityRole="radiogroup">
          {WINDOWS.map((window) => {
            const selected = form.availability === window;
            return (
              <Pressable
                key={window}
                onPress={() => { update("availability", window); void Haptics.selectionAsync(); }}
                style={[styles.windowButton, selected && styles.windowButtonSelected]}
              >
                <Text style={[styles.windowText, selected && styles.windowTextSelected]}>{window}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionKicker}>3 · INTAKE</Text>
        <Text style={styles.sectionTitle}>Give the conversation a useful starting point.</Text>
        <Field label="Name" value={form.name} onChangeText={(value) => update("name", value)} placeholder="Your full name" autoCapitalize="words" />
        <Field label="Email" value={form.email} onChangeText={(value) => update("email", value)} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone" value={form.phone} onChangeText={(value) => update("phone", value)} placeholder="(555) 555 5555" keyboardType="phone-pad" />
        <Field label="Organization" value={form.company} onChangeText={(value) => update("company", value)} placeholder="Hospice or organization" optional />
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>What are you trying to change?</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Describe the situation, pressure, goal, and what a successful engagement should change. Do not include patient PHI."
            placeholderTextColor={colors.mutedForeground}
            value={form.message}
            onChangeText={(value) => update("message", value)}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.separationCard}>
          <Feather name="info" size={18} color={colors.primary} />
          <Text style={styles.separationText}>Consulting is not included in Standard or Elite and is not purchased through Apple. Any engagement begins only after scope and commercial terms are agreed separately.</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={!isValid || loading}
          onPress={submit}
          style={({ pressed }) => [styles.submit, (!isValid || loading) && styles.disabled, pressed && isValid && styles.pressed]}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.submitText}>Request the conversation</Text><Feather name="arrow-right" size={20} color="#FFFFFF" /></>}
        </Pressable>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return <View style={stylesStatic.summaryRow}><Text style={[stylesStatic.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[stylesStatic.summaryValue, { color: colors.foreground }]}>{value}</Text></View>;
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string; optional?: boolean }) {
  const colors = useColors();
  return (
    <View style={stylesStatic.fieldGroup}>
      <Text style={[stylesStatic.label, { color: colors.foreground }]}>{props.label}{props.optional ? <Text style={{ color: colors.mutedForeground }}> · optional</Text> : null}</Text>
      <TextInput {...props} style={[stylesStatic.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.borderStrong }]} placeholderTextColor={colors.mutedForeground} />
    </View>
  );
}

const stylesStatic = StyleSheet.create({
  fieldGroup: { gap: 7 },
  label: { fontSize: 13, fontWeight: "700" },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 14, borderCurve: "continuous", paddingHorizontal: 14, fontSize: 15 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 9 },
  summaryLabel: { fontSize: 12 },
  summaryValue: { flex: 1, textAlign: "right", fontSize: 12, fontWeight: "700" },
});

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    hero: { backgroundColor: colors.heroBackground, paddingHorizontal: 22, paddingBottom: 30, gap: 8 },
    heroKicker: { color: colors.heroMuted, fontSize: 9, letterSpacing: 2, marginTop: 4, ...font("bold") },
    heroTitle: { color: colors.heroForeground, fontSize: 31, lineHeight: 36, letterSpacing: -0.8, ...font("heavy") },
    heroBody: { color: colors.heroMuted, fontSize: 14, lineHeight: 21, ...font("regular") },
    content: { paddingHorizontal: 20, paddingTop: 26, gap: 14 },
    sectionKicker: { color: colors.primary, fontSize: 9, letterSpacing: 1.8, marginTop: 8, ...font("bold") },
    sectionTitle: { color: colors.foreground, fontSize: 24, lineHeight: 29, letterSpacing: -0.5, ...font("heavy") },
    sectionBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, ...font("regular") },
    serviceList: { gap: 0 },
    serviceRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 86, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
    serviceRowSelected: { backgroundColor: colors.primaryMuted, marginHorizontal: -10, paddingHorizontal: 10, borderRadius: 14, borderCurve: "continuous" },
    serviceIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    serviceIconSelected: { backgroundColor: colors.primary },
    serviceCopy: { flex: 1, gap: 3 },
    serviceTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    serviceBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, ...font("regular") },
    windowRow: { flexDirection: "row", gap: 8 },
    windowButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, borderRadius: 14, borderCurve: "continuous" },
    windowButtonSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
    windowText: { color: colors.mutedForeground, fontSize: 12, ...font("semibold") },
    windowTextSelected: { color: colors.primary },
    fieldGroup: { gap: 7 },
    label: { color: colors.foreground, fontSize: 13, ...font("bold") },
    textarea: { minHeight: 140, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, color: colors.foreground, borderRadius: 16, borderCurve: "continuous", padding: 14, fontSize: 15, lineHeight: 21, ...font("regular") },
    separationCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.muted, borderRadius: 14, padding: 13 },
    separationText: { flex: 1, color: colors.mutedForeground, fontSize: 10, lineHeight: 15, ...font("regular") },
    error: { color: colors.destructive, fontSize: 12, lineHeight: 18, ...font("semibold") },
    submit: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, borderRadius: 17, borderCurve: "continuous", backgroundColor: colors.primary },
    submitText: { color: "#FFFFFF", fontSize: 16, ...font("bold") },
    disabled: { opacity: 0.42 },
    pressed: { opacity: 0.8, transform: [{ scale: 0.995 }] },
    confirmation: { flex: 1, justifyContent: "center", paddingHorizontal: 26, gap: 14 },
    successIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
    confirmationKicker: { color: colors.primary, fontSize: 9, letterSpacing: 2, ...font("bold") },
    confirmationTitle: { color: colors.foreground, fontSize: 31, lineHeight: 36, ...font("heavy") },
    confirmationBody: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, ...font("regular") },
    confirmationCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 18, borderCurve: "continuous", paddingHorizontal: 14, paddingVertical: 6 },
  });
}
