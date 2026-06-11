import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { api, apiErrorMessage } from "@/lib/api";
import { formatCompactNumber } from "@/lib/format";
import { recordActivity } from "@/lib/storage";
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
import { colors, spacing } from "@/lib/theme";

type DailyDrill = Record<string, unknown> | null;

export default function DrillsScreen() {
  const [dailyDrill, setDailyDrill] = useState<DailyDrill>(null);
  const [drills, setDrills] = useState<Array<{ index: number; category: string; drill: string }>>([]);
  const [notes, setNotes] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([api.getDailyDrill(), api.getDrills()]).then((results) => {
      if (!mounted) return;
      const [dailyResult, libraryResult] = results;
      if (dailyResult.status === "fulfilled") {
        setDailyDrill(dailyResult.value);
        const index = Number(dailyResult.value.index ?? dailyResult.value.drillIndex ?? 0);
        setSelectedIndex(Number.isNaN(index) ? 0 : index);
        setSelectedTitle(String(dailyResult.value.title ?? dailyResult.value.name ?? dailyResult.value.drill ?? "Daily Drill"));
      }
      if (libraryResult.status === "fulfilled") {
        setDrills(libraryResult.value);
      }
      const failed = [dailyResult, libraryResult].find((result) => result.status === "rejected");
      if (failed?.status === "rejected") {
        setError(apiErrorMessage(failed.reason, "Unable to load the drill library right now."));
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  const drillMeta = useMemo(() => {
    const entries = dailyDrill ? Object.entries(dailyDrill).filter(([, value]) => value !== null && value !== undefined) : [];
    return entries.slice(0, 6);
  }, [dailyDrill]);

  async function completeDrill() {
    if (selectedIndex === null) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.submitDrillCompletion({
        drillIndex: selectedIndex,
        drillTitle: selectedTitle,
        notes: notes.trim() || undefined,
      });
      setSuccess("Drill marked complete and saved locally.");
      recordActivity({
        title: "Completed drill",
        subtitle: selectedTitle,
        kind: "drill",
      });
      setNotes("");
    } catch (submitError) {
      setError(apiErrorMessage(submitError, "Unable to save the completion."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenScrollView contentContainerStyle={{ gap: spacing.lg }}>
      <View style={{ gap: 10, paddingTop: 8 }}>
        <Pill tone="accent">Daily drill</Pill>
        <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
          Reps, notes, and accountability in one place.
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Capture the drill, write your notes, and save the completion without losing progress if the app refreshes.
        </Text>
      </View>

      <Card>
        <SectionHeader
          title="Today’s drill"
          subtitle="A live backend-generated drill with whatever context the server returns."
          action={<SecondaryButton title="Reload" onPress={() => setRefreshTick((tick) => tick + 1)} />}
        />
        {loading ? (
          <Text style={{ color: colors.muted }}>Loading...</Text>
        ) : error ? (
          <Text style={{ color: colors.danger }}>{error}</Text>
        ) : dailyDrill ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
              {String(dailyDrill.title ?? dailyDrill.name ?? dailyDrill.drill ?? "Daily Drill")}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
              {String(dailyDrill.prompt ?? dailyDrill.description ?? dailyDrill.brief ?? "Complete the drill and capture your notes.")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {drillMeta.map(([key, value]) => (
                <Pill key={key} tone="neutral">
                  {key}: {typeof value === "string" ? value : JSON.stringify(value)}
                </Pill>
              ))}
            </View>
          </View>
        ) : (
          <Text style={{ color: colors.muted }}>No daily drill returned yet.</Text>
        )}
      </Card>

      <Card>
        <SectionHeader title="Completion notes" subtitle="Capture what happened and what you’re doing next." />
        <View style={{ gap: spacing.md }}>
          <Field
            label="Notes"
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholder="What happened? What did you learn? What should you do tomorrow?"
          />
          {success ? (
            <Text style={{ color: colors.good, fontSize: 13, lineHeight: 18 }}>{success}</Text>
          ) : null}
          {error ? <Text style={{ color: colors.danger, fontSize: 13, lineHeight: 18 }}>{error}</Text> : null}
          <PrimaryButton
            title={submitting ? "Saving..." : "Mark complete"}
            loading={submitting}
            onPress={completeDrill}
          />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Drill library" subtitle="Every drill the backend exposes, shown as a simple mobile list." />
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
          {formatCompactNumber(drills.length)} drills available
        </Text>
        <View style={{ gap: spacing.sm }}>
          {drills.map((drill) => (
            <PressableCard
              key={drill.index}
              onPress={() => {
                setSelectedIndex(drill.index);
                setSelectedTitle(drill.drill);
                setSuccess(null);
              }}
              style={{
                borderColor: selectedIndex === drill.index ? colors.accent : colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{drill.drill}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                <Pill tone="neutral">#{drill.index}</Pill>
                <Pill tone="neutral">{drill.category}</Pill>
              </View>
            </PressableCard>
          ))}
        </View>
      </Card>
    </ScreenScrollView>
  );
}
