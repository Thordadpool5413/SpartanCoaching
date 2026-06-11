import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";

import { api, apiErrorMessage } from "@/lib/api";
import { recordActivity, STORAGE_KEYS, useStoredJson } from "@/lib/storage";
import { colors, radius, spacing } from "@/lib/theme";
import {
  Card,
  Field,
  Pill,
  PrimaryButton,
  PressableCard,
  ScreenScrollView,
  SectionHeader,
  SecondaryButton,
} from "@/components/ui";

type ContactDraft = {
  name: string;
  email: string;
  phone: string;
  company: string;
  serviceType: string;
  message: string;
};

const initialDraft: ContactDraft = {
  name: "",
  email: "",
  phone: "",
  company: "",
  serviceType: "Discovery call",
  message: "",
};

const serviceTypes = [
  "Discovery call",
  "New hire onboarding",
  "Territory planning",
  "Content support",
  "Something else",
] as const;

export default function ContactScreen() {
  const [draft, setDraft] = useStoredJson<ContactDraft>(STORAGE_KEYS.contactDraft, initialDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isValid = useMemo(
    () =>
      draft.name.trim().length >= 2 &&
      draft.email.trim().includes("@") &&
      draft.phone.trim().length >= 10 &&
      draft.message.trim().length >= 10,
    [draft]
  );

  async function handleSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.submitInquiry({
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        company: draft.company.trim() || undefined,
        serviceType: draft.serviceType.trim() || undefined,
        message: draft.message.trim(),
        submittedAt: Date.now(),
      });

      recordActivity({
        title: "Submitted contact form",
        subtitle: draft.serviceType,
        kind: "contact",
      });

      setSuccess("Your discovery request was sent. The draft has been cleared locally.");
      setDraft(initialDraft);
    } catch (submissionError) {
      setError(apiErrorMessage(submissionError, "Unable to send the contact request right now."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: 120 }}>
        <View style={{ gap: 10, paddingTop: 8 }}>
          <Pill tone="good">Discovery</Pill>
          <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
            Start the conversation.
          </Text>
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
            TestFlight users can reach the contact workflow without logging in. Public submissions still stay on the server side and use the existing backend route.
          </Text>
        </View>

        <Card>
          <SectionHeader
            title="What do you need?"
            subtitle="Pick a starting point and the form will keep the draft on device."
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {serviceTypes.map((serviceType) => (
              <PressableCard
                key={serviceType}
                onPress={() => setDraft({ ...draft, serviceType })}
                style={{
                  borderColor: draft.serviceType === serviceType ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>{serviceType}</Text>
              </PressableCard>
            ))}
          </View>
        </Card>

        <Card>
          <SectionHeader title="Inquiry form" subtitle="Use this for beta feedback, discovery, or a service request." />
          <View style={{ gap: spacing.md }}>
            <Field
              label="Name"
              value={draft.name}
              onChangeText={(name) => setDraft({ ...draft, name })}
              placeholder="Your name"
            />
            <Field
              label="Email"
              value={draft.email}
              onChangeText={(email) => setDraft({ ...draft, email })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
            />
            <Field
              label="Phone"
              value={draft.phone}
              onChangeText={(phone) => setDraft({ ...draft, phone })}
              keyboardType="phone-pad"
              placeholder="(555) 123-4567"
            />
            <Field
              label="Company"
              value={draft.company}
              onChangeText={(company) => setDraft({ ...draft, company })}
              placeholder="Your organization"
            />
            <Field
              label="Service type"
              value={draft.serviceType}
              onChangeText={(serviceType) => setDraft({ ...draft, serviceType })}
              placeholder="Discovery call"
            />
            <Field
              label="Message"
              value={draft.message}
              onChangeText={(message) => setDraft({ ...draft, message })}
              multiline
              placeholder="Tell us what you want to solve, review, or build next."
              helper="Public submissions are rate-limited and handled server-side."
            />

            {error ? <Text style={{ color: colors.danger, fontSize: 13, lineHeight: 18 }}>{error}</Text> : null}
            {success ? <Text style={{ color: colors.good, fontSize: 13, lineHeight: 18 }}>{success}</Text> : null}

            <PrimaryButton title={submitting ? "Sending..." : "Send inquiry"} loading={submitting} disabled={!isValid} onPress={handleSubmit} />
          </View>
        </Card>

        <Card>
          <SectionHeader title="Beta notes" subtitle="A few important details for the first release." />
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <Pill tone="neutral">No login gate</Pill>
              <Pill tone="neutral">Server owns secrets</Pill>
              <Pill tone="neutral">Drafts persist locally</Pill>
            </View>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
              If a tester backgrounds the app or refreshes the route, the draft comes back from local native storage.
            </Text>
            <SecondaryButton title="Reset draft" onPress={() => setDraft(initialDraft)} />
          </View>
        </Card>
      </ScreenScrollView>
    </KeyboardAvoidingView>
  );
}
