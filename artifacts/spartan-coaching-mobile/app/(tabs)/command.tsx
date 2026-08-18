/**
 * Field Planner — calm preparation and follow-through workspace.
 * Derives day summary from the same /api/v1/sales-workflow/today as the power surface.
 */
import React, { useMemo } from "react";
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
import { MissionCard } from "@/components/ui/MissionCard";
import { ToolAnatomyRelated } from "@/components/ToolAnatomy";
import { trackMobileEvent } from "@/lib/analytics";
import {
  getToolById,
  recommendRelated,
  relatedToAnatomyItems,
} from "@workspace/field-kit-catalog";

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
  const relatedItems = useMemo(
    () =>
      relatedToAnatomyItems(
        recommendRelated(
          "sales-workflow",
          {
            platform: "ios",
            canUseFieldKit: !!canUseFieldKit,
            contextTags: ["prepare", "follow_up", "account"],
            limit: 4,
          },
          getToolById,
        ),
      ),
    [canUseFieldKit],
  );

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const calls = today?.calls ?? [];
  const nextCall = calls[0];
  const openActions = today?.actions ?? [];
  const openActionCount = openActions.length;
  // Ledger lives on full workflow (GET /accounts); hub points reps there.

  if (!isAuthenticated) {
    return (
      <Screen testID="screen-command-logged-out">
        <ScreenHeader title="Field Planner" subtitle="Sign in to prepare the next conversation." />
        <EmptyState
          icon="target"
          title="Client login required"
          body="Field Planner needs an active Spartan Coaching account."
          ctaTitle="Sign in"
          onCta={() => router.push("/login")}
        />
      </Screen>
    );
  }

  if (!canUseFieldKit) {
    return (
      <Screen testID="screen-command-locked">
        <ScreenHeader title="Field Planner" subtitle="Unlock Hospice Sales Pro to prepare and follow through." />
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
      <ScreenHeader
        title="Field Planner"
        subtitle={`${dateLabel} · your next conversation and commitment`}
      />

      <SectionKicker>Next conversation</SectionKicker>

      {/* Day stats — quiet, not second heroes */}
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 4 }}
        testID="command-day-stats"
      >
        {[
          { label: `${calls.length} visit${calls.length === 1 ? "" : "s"}` },
          { label: `${openActionCount} open action${openActionCount === 1 ? "" : "s"}` },
        ].map((s) => (
          <View
            key={s.label}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              borderWidth: StyleSheet.hairlineWidth * 2,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Text style={[{ color: colors.mutedForeground, fontSize: 12 }, font("semibold")]}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      {todayLoading && !today ? (
        <View style={{ paddingVertical: 32, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[{ color: colors.mutedForeground, fontSize: 13, marginTop: 10 }, font("regular")]}>
            Loading your field plan…
          </Text>
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
        <View style={{ marginTop: 10 }} testID="card-next-call">
          <MissionCard
            kicker="Next visit"
            title={nextCall.purpose || "Account visit"}
            subtitle={`${formatCallTime(nextCall.schedule?.startsAt)} · ${nextCall.status} · prepare → practice → capture`}
            ctaLabel="Open full workflow"
            onCta={() => {
              void trackMobileEvent("craft", "mission_cta_tap", {
                metadata: { surface: "command", platform: "ios", source: "next_call" },
              });
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/sales-workflow");
            }}
            secondaryLabel="Prep tools"
            onSecondary={() => router.push("/(tabs)/tools")}
            ctaTestID="button-open-workflow"
          />
        </View>
      ) : !todayLoading ? (
        <View style={{ marginTop: 10 }} testID="command-empty-day">
          <EmptyState
            icon="calendar"
            title="Nothing is planned yet"
            body="Start with the conversation ahead of you. Prepare the approach, practice the hard moment, and leave with one next step."
            ctaTitle="Plan a conversation"
            onCta={() => {
              void trackMobileEvent("craft", "mission_cta_tap", {
                metadata: { surface: "command", platform: "ios", source: "empty_day" },
              });
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/sales-workflow");
            }}
          />
        </View>
      ) : null}

      {/* Secondary only — never a second emphasis when nextCall owns the mission */}
      {primary && primary.kind !== "command" && !nextCall ? (
        <SpartanCard variant="quiet" style={{ marginTop: 12 }} testID="command-also-next">
          <SectionKicker>Also next</SectionKicker>
          <Text style={[{ color: colors.foreground, fontSize: 15, marginTop: 8 }, font("bold")]}>
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

      <Text style={[{ color: colors.mutedForeground, fontSize: 12, marginTop: 20, marginBottom: 8 }, font("semibold")]}>
        {["director", "vp", "owner"].includes(jobRole)
          ? "Leadership preparation"
          : "More ways to prepare"}
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

      {openActionCount > 0 ? (
        <SpartanCard variant="default" style={{ marginTop: 12 }} testID="card-open-actions">
          <SectionKicker>Open next steps</SectionKicker>
          <Text style={[{ color: colors.foreground, fontSize: 16, marginTop: 8 }, font("bold")]}>
            {openActionCount} approved action{openActionCount === 1 ? "" : "s"}
          </Text>
          <Text
            style={[
              { color: colors.mutedForeground, fontSize: 13, marginTop: 4, lineHeight: 18 },
              font("regular"),
            ]}
          >
            Schedule the next visit or draft a follow-up email in the full workflow.
          </Text>
          <SpartanButton
            title="Work next actions"
            variant="outline"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/sales-workflow");
            }}
            style={{ marginTop: 12 }}
            testID="button-work-next-actions"
          />
        </SpartanCard>
      ) : null}

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

      <ToolAnatomyRelated items={relatedItems} />
    </Screen>
  );
}
