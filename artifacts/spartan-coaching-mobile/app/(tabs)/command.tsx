/**
 * Command hub — calm front door to Sales Command Center.
 * Derives day summary from the same /api/v1/sales-workflow/today as the power surface.
 */
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { useMission } from "@/lib/useMission";
import { font } from "@/lib/typography";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { SpartanCard } from "@/components/ui/SpartanCard";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListRow } from "@/components/ui/ListRow";

function formatCallTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function CommandHubScreen() {
  const colors = useColors();
  const { canUseFieldKit, isAuthenticated } = useAuth();
  const { today, todayLoading, todayError, primary, secondary, refreshAll, jobRole } = useMission();

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const calls = today?.calls ?? [];
  const nextCall = calls[0];

  if (!isAuthenticated) {
    return (
      <Screen testID="screen-command-logged-out">
        <ScreenHeader title="Command Center" subtitle="Sign in to run your day." />
        <EmptyState
          icon="target"
          title="Client login required"
          body="Hospice Sales Pro Command Center needs an active account."
          ctaTitle="Sign in"
          onCta={() => router.push("/login")}
        />
      </Screen>
    );
  }

  if (!canUseFieldKit) {
    return (
      <Screen testID="screen-command-locked">
        <ScreenHeader title="Command Center" subtitle="Unlock Hospice Sales Pro to run live workflows." />
        <EmptyState
          icon="lock"
          title="Access locked"
          body="Subscribe or restore access to plan calls, capture outcomes, and prep visits."
          ctaTitle="Open Account"
          onCta={() => router.push("/(tabs)/account")}
        />
      </Screen>
    );
  }

  return (
    <Screen testID="screen-command-hub">
      <ScreenHeader title="Command Center" subtitle={dateLabel} />

      <SectionKicker>Today</SectionKicker>

      {todayLoading && !today ? (
        <View style={{ paddingVertical: 32, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {todayError ? (
        <SpartanCard variant="quiet" style={{ marginTop: 8 }}>
          <Text style={[{ color: colors.mutedForeground, fontSize: 13 }, font("regular")]}>
            {todayError}
          </Text>
          <SpartanButton title="Retry" variant="outline" onPress={() => void refreshAll()} style={{ marginTop: 12 }} />
        </SpartanCard>
      ) : null}

      {nextCall ? (
        <SpartanCard variant="emphasis" style={{ marginTop: 10 }} testID="card-next-call">
          <SectionKicker>Next visit</SectionKicker>
          <Text style={[{ color: colors.foreground, fontSize: 20, marginTop: 8 }, font("heavy")]}>
            {nextCall.purpose || "Account visit"}
          </Text>
          <Text style={[{ color: colors.mutedForeground, fontSize: 13, marginTop: 6 }, font("regular")]}>
            {formatCallTime(nextCall.schedule?.startsAt)} · {nextCall.status}
          </Text>
          <SpartanButton
            title="Open full workflow"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/sales-workflow");
            }}
            style={{ marginTop: 14 }}
            testID="button-open-workflow"
          />
        </SpartanCard>
      ) : (
        <View style={{ marginTop: 10 }} testID="command-empty-day">
          <EmptyState
            icon="calendar"
            title="No visits scheduled today"
            body="Add your first account visit — plan, prep, capture outcome, lock the next step."
            ctaTitle="Schedule first visit"
            onCta={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/sales-workflow");
            }}
          />
        </View>
      )}

      {/* Align language with Home mission when no checklist pressure */}
      {primary && primary.kind !== "command" && !nextCall ? (
        <SpartanCard variant="default" style={{ marginTop: 12 }}>
          <SectionKicker>Also next</SectionKicker>
          <Text style={[{ color: colors.foreground, fontSize: 16, marginTop: 8 }, font("bold")]}>
            {primary.title}
          </Text>
          <Text style={[{ color: colors.mutedForeground, fontSize: 13, marginTop: 4, lineHeight: 18 }, font("regular")]}>
            {primary.subtitle}
          </Text>
          <SpartanButton
            title={primary.ctaLabel}
            variant="outline"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(primary.href as any);
            }}
            style={{ marginTop: 12 }}
          />
        </SpartanCard>
      ) : null}

      <Text style={[{ color: colors.foreground, fontSize: 13, marginTop: 20, marginBottom: 8 }, font("bold")]}>
        {["director", "vp", "owner"].includes(jobRole) ? "Lead the day" : "Prep for the room"}
      </Text>
      {secondary
        .filter((s) => s.title !== "Full Command workflow")
        .map((s) => (
          <ListRow
            key={s.title}
            title={s.title}
            subtitle={
              s.title.includes("staffing")
                ? "Leader math · educational planning"
                : "Supports the next visit"
            }
            onPress={() => router.push(s.href as any)}
          />
        ))}

      <Pressable
        onPress={() => router.push("/sales-workflow")}
        style={{ marginTop: 8, minHeight: 44, justifyContent: "center", flexDirection: "row", alignItems: "center", gap: 6 }}
        testID="link-full-workflow"
      >
        <Text style={[{ color: colors.primary, fontSize: 14 }, font("bold")]}>Full day workflow</Text>
        <Feather name="arrow-right" size={16} color={colors.primary} />
      </Pressable>

      {calls.length > 1 ? (
        <View style={{ marginTop: 20 }}>
          <Text style={[{ color: colors.mutedForeground, fontSize: 11, letterSpacing: 1.2 }, font("bold")]}>
            ALSO TODAY · {calls.length} CALLS
          </Text>
          {calls.slice(1, 4).map((c) => (
            <ListRow
              key={c.id}
              title={c.purpose || "Visit"}
              subtitle={`${formatCallTime(c.schedule?.startsAt)} · ${c.status}`}
              onPress={() => router.push("/sales-workflow")}
              icon="circle"
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
