import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Text, View } from "react-native";

import { Card, MetricCard, Pill, PressableCard, ScreenScrollView, SectionHeader, SecondaryButton } from "@/components/ui";
import { api, apiErrorMessage } from "@/lib/api";
import { formatCompactNumber, formatDate, formatRelativeTime } from "@/lib/format";
import { ActivityItem, recordActivity, STORAGE_KEYS, touchStreak, useStoredJson } from "@/lib/storage";
import { colors, gradients, radius, spacing } from "@/lib/theme";

type DailyPreview = Record<string, unknown> | null;

export default function TodayScreen() {
  const [streak] = useStoredJson(STORAGE_KEYS.streak, {
    current: 0,
    best: 0,
    lastSeen: "",
    totalSessions: 0,
  });
  const [favorites] = useStoredJson<ActivityItem[]>(STORAGE_KEYS.favorites, []);
  const [activities] = useStoredJson<ActivityItem[]>(STORAGE_KEYS.activity, []);
  const [dailyDrill, setDailyDrill] = useState<DailyPreview>(null);
  const [counts, setCounts] = useState({ articles: 0, resources: 0, podcasts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    touchStreak();

    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      api.getDailyDrill(),
      api.getArticles(),
      api.getResources(),
      api.getPodcasts(),
    ]).then((results) => {
      if (!mounted) return;

      const [drillResult, articlesResult, resourcesResult, podcastsResult] = results;

      if (drillResult.status === "fulfilled") {
        setDailyDrill(drillResult.value);
      }

      if (articlesResult.status === "fulfilled") {
        setCounts((current) => ({ ...current, articles: articlesResult.value.articles.length }));
      }

      if (resourcesResult.status === "fulfilled") {
        setCounts((current) => ({ ...current, resources: resourcesResult.value.resources.length }));
      }

      if (podcastsResult.status === "fulfilled") {
        setCounts((current) => ({ ...current, podcasts: podcastsResult.value.podcasts.length }));
      }

      const failed = [drillResult, articlesResult, resourcesResult, podcastsResult].find(
        (result) => result.status === "rejected"
      );

      if (failed?.status === "rejected") {
        setError(apiErrorMessage(failed.reason, "Unable to load a few live data points right now."));
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  const recent = useMemo(() => activities.slice(0, 5), [activities]);
  const favoriteCount = favorites.length;

  const quickActions = [
    { title: "AI Coach", subtitle: "Talk through the next move", href: "/coach" },
    { title: "Daily Drill", subtitle: "Start a practice rep", href: "/drills" },
    { title: "Role Play", subtitle: "Run a live scenario", href: "/roleplay" },
    { title: "Assessment", subtitle: "Review or resume", href: "/assessment/default" },
    { title: "Contact", subtitle: "Open discovery form", href: "/contact" },
    { title: "Weekly Plan", subtitle: "Build the week", href: "/tools/weekly-plan-builder" },
  ] as const;

  return (
    <ScreenScrollView contentContainerStyle={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.md, paddingTop: 8 }}>
        <LinearGradient
          colors={gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: radius.xl,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
            <View style={{ flex: 1, gap: 10 }}>
              <Pill tone="neutral">TestFlight beta unlocked</Pill>
              <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
                Spartan Coaching
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.86)", fontSize: 15, lineHeight: 22 }}>
                Native coaching, practice, calculators, and admin review built for mobile-first field work.
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                <Pill tone="neutral">No login gate</Pill>
                <Pill tone="good">Local drafts</Pill>
                <Pill tone="warning">Shareable PDFs</Pill>
              </View>
            </View>

            <View
              style={{
                alignSelf: "flex-start",
                minWidth: 88,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: radius.lg,
                backgroundColor: "rgba(7,17,30,0.18)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.14)",
              }}
            >
              <Text style={{ color: colors.text, fontSize: 26, lineHeight: 30, fontWeight: "900", textAlign: "center" }}>
                {streak.current}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 11, fontWeight: "800", textAlign: "center" }}>
                day streak
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <MetricCard label="Favorites" value={formatCompactNumber(favoriteCount)} tone="accent" caption="Saved for fast access" />
        <MetricCard label="Recent" value={formatCompactNumber(recent.length)} tone="good" caption="Actions in the last session" />
        <MetricCard label="Articles" value={formatCompactNumber(counts.articles)} tone="warning" caption="Live library items" />
        <MetricCard label="Resources" value={formatCompactNumber(counts.resources)} tone="neutral" caption="PDFs and references" />
      </View>

      <Card>
        <SectionHeader
          title="Quick actions"
          subtitle="Jump straight into the workflows testers will actually use."
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {quickActions.map((action) => (
            <PressableCard
              key={action.href}
              onPress={() => {
                recordActivity({
                  title: action.title,
                  subtitle: action.subtitle,
                  kind: "navigation",
                });
                router.push(action.href);
              }}
              style={{ flexBasis: "48%", flexGrow: 1 }}
            >
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{action.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>{action.subtitle}</Text>
            </PressableCard>
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Today’s drill"
          subtitle="A live preview of the practice surface that keeps reps moving."
          action={
            <SecondaryButton title="Open drills" onPress={() => router.push("/drills")} />
          }
        />
        {loading ? (
          <View style={{ paddingVertical: 12, alignItems: "center" }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : error ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.danger, fontSize: 14, lineHeight: 20 }}>{error}</Text>
            <SecondaryButton title="Try again" onPress={() => setRefreshTick((tick) => tick + 1)} />
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
              {String(dailyDrill?.title ?? dailyDrill?.name ?? dailyDrill?.headline ?? "Daily drill ready")}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
              {String(dailyDrill?.prompt ?? dailyDrill?.drill ?? dailyDrill?.description ?? "Use the drill screen to capture completion, notes, and momentum for the day.")}
            </Text>
          </View>
        )}
      </Card>

      <Card>
        <SectionHeader title="Recent activity" subtitle="What the app has been helping with lately." />
        {recent.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Your recent activity will appear here after you start using the tools.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {recent.map((item) => (
              <View key={item.id} style={{ gap: 4, paddingVertical: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", flex: 1 }}>{item.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{formatRelativeTime(item.createdAt)}</Text>
                </View>
                {item.subtitle ? (
                  <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>{item.subtitle}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <SectionHeader title="Backend snapshot" subtitle="Useful counts from the live Spartan Coaching service." />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Pill tone="neutral">{counts.podcasts} podcasts</Pill>
          <Pill tone="neutral">{counts.articles} articles</Pill>
          <Pill tone="neutral">{counts.resources} resources</Pill>
          <Pill tone="neutral">Updated {formatDate(new Date())}</Pill>
        </View>
      </Card>
    </ScreenScrollView>
  );
}
