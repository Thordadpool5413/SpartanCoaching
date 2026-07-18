import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { api, apiErrorMessage } from "@/lib/api";
import { formatDate, formatCompactNumber, formatRelativeTime } from "@/lib/format";
import { ActivityItem, FavoriteItem, recordActivity, STORAGE_KEYS, useStoredJson } from "@/lib/storage";
import {
  Card,
  Field,
  MetricCard,
  Pill,
  PrimaryButton,
  PressableCard,
  ScreenScrollView,
  SectionHeader,
  SecondaryButton,
} from "@/components/ui";
import { colors, radius, spacing } from "@/lib/theme";

type SectionKey = "publish" | "review" | "analytics";

const sectionButtons: Array<{ key: SectionKey; label: string; subtitle: string }> = [
  { key: "publish", label: "Publish", subtitle: "Create articles and resources" },
  { key: "review", label: "Review", subtitle: "Assessments and inquiries" },
  { key: "analytics", label: "Analytics", subtitle: "Visitors, events, and usage" },
];

export default function AdminScreen() {
  const [section, setSection] = useState<SectionKey>("publish");
  const [recentActivity] = useStoredJson<ActivityItem[]>(STORAGE_KEYS.activity, []);
  const [favorites] = useStoredJson<FavoriteItem[]>(STORAGE_KEYS.favorites, []);
  const [inquiries, setInquiries] = useState<Array<any>>([]);
  const [assessmentSubmissions, setAssessmentSubmissions] = useState<Array<any>>([]);
  const [assessments, setAssessments] = useState<Array<any>>([]);
  const [visitorAnalytics, setVisitorAnalytics] = useState<any>(null);
  const [eventAnalytics, setEventAnalytics] = useState<any>(null);
  const [aiUsage, setAiUsage] = useState<Record<string, unknown> | null>(null);
  const [usageEvents, setUsageEvents] = useState<Array<any>>([]);
  const [resourceLeads, setResourceLeads] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [articleDraft, setArticleDraft] = useState({
    title: "",
    description: "",
    linkedinUrl: "",
    pdfUrl: "",
    featured: "false",
    publishDate: `${Date.now()}`,
  });
  const [resourceDraft, setResourceDraft] = useState({
    title: "",
    description: "",
    fileUrl: "",
    category: "Guide",
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.allSettled([
      api.getInquiries(),
      api.getAssessments(),
      api.getVisitorAnalytics(),
      api.getEventAnalytics(),
      api.getAiUsage(),
      api.getUsageEvents(),
      api.getResourceLeads(),
    ]).then(async (results) => {
      if (!mounted) return;
      const [inquiriesResult, assessmentsResult, visitorsResult, eventsResult, aiUsageResult, usageEventsResult, resourceLeadsResult] = results;

      if (inquiriesResult.status === "fulfilled") setInquiries(inquiriesResult.value.inquiries);
      if (assessmentsResult.status === "fulfilled") setAssessments(assessmentsResult.value);
      if (visitorsResult.status === "fulfilled") setVisitorAnalytics(visitorsResult.value.analytics);
      if (eventsResult.status === "fulfilled") setEventAnalytics(eventsResult.value.analytics);
      if (aiUsageResult.status === "fulfilled") setAiUsage(aiUsageResult.value);
      if (usageEventsResult.status === "fulfilled") setUsageEvents(usageEventsResult.value.events);
      if (resourceLeadsResult.status === "fulfilled") setResourceLeads(resourceLeadsResult.value.leads);

      const defaultAssessmentId = assessmentsResult.status === "fulfilled" && assessmentsResult.value.length > 0
        ? assessmentsResult.value[0].id
        : null;

      if (defaultAssessmentId) {
        const submissions = await api.getAssessmentSubmissions(defaultAssessmentId).catch(() => null);
        if (submissions) {
          setAssessmentSubmissions(submissions.submissions);
        }
      }

      const failed = [inquiriesResult, assessmentsResult, visitorsResult, eventsResult, aiUsageResult, usageEventsResult, resourceLeadsResult].find(
        (result) => result.status === "rejected"
      );
      if (failed?.status === "rejected") {
        setError(apiErrorMessage(failed.reason, "One or more admin data sources failed to load."));
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      inquiries: inquiries.length,
      submissions: assessmentSubmissions.length,
      visitors: visitorAnalytics ? Number(visitorAnalytics.month ?? 0) : 0,
      events: eventAnalytics ? Number(eventAnalytics.month ?? 0) : 0,
      activity: recentActivity.length,
    }),
    [assessmentSubmissions.length, eventAnalytics, inquiries.length, recentActivity.length, visitorAnalytics]
  );

  async function publishArticle() {
    if (!articleDraft.title || !articleDraft.description || !articleDraft.linkedinUrl) return;
    await api.createArticle({
      title: articleDraft.title,
      description: articleDraft.description,
      linkedinUrl: articleDraft.linkedinUrl,
      pdfUrl: articleDraft.pdfUrl || undefined,
      featured: articleDraft.featured === "true",
      publishDate: Number(articleDraft.publishDate) || Date.now(),
    });
    recordActivity({
      title: "Published article",
      subtitle: articleDraft.title,
      kind: "admin",
    });
    setArticleDraft({
      title: "",
      description: "",
      linkedinUrl: "",
      pdfUrl: "",
      featured: "false",
      publishDate: `${Date.now()}`,
    });
  }

  async function publishResource() {
    if (!resourceDraft.title || !resourceDraft.fileUrl || !resourceDraft.category) return;
    await api.createResource({
      title: resourceDraft.title,
      description: resourceDraft.description || undefined,
      fileUrl: resourceDraft.fileUrl,
      category: resourceDraft.category,
    });
    recordActivity({
      title: "Published resource",
      subtitle: resourceDraft.title,
      kind: "admin",
    });
    setResourceDraft({
      title: "",
      description: "",
      fileUrl: "",
      category: "Guide",
    });
  }

  return (
    <ScreenScrollView contentContainerStyle={{ gap: spacing.lg }}>
      <View style={{ gap: 10, paddingTop: 8 }}>
        <Pill tone="good">Beta admin unlocked</Pill>
        <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
          Publish, review, and see what the field is doing.
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          TestFlight users get full access in v1 so the product can be exercised like a real working admin surface.
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <MetricCard label="Inquiries" value={formatCompactNumber(stats.inquiries)} tone="accent" caption="Public discovery submissions" />
        <MetricCard label="Submissions" value={formatCompactNumber(stats.submissions)} tone="good" caption="Assessment reviews" />
        <MetricCard label="Visitors" value={formatCompactNumber(stats.visitors)} tone="warning" caption="Monthly visitor count" />
        <MetricCard label="Events" value={formatCompactNumber(stats.events)} tone="neutral" caption="Tracked events this month" />
        <MetricCard label="Activity" value={formatCompactNumber(stats.activity)} tone="accent" caption="Local actions in recent history" />
      </View>

      <Card>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {sectionButtons.map((button) => (
            <SecondaryButton
              key={button.key}
              title={button.label}
              onPress={() => setSection(button.key)}
            />
          ))}
        </View>
      </Card>

      {section === "publish" ? (
        <>
          <Card>
            <SectionHeader title="Publish article" subtitle="Create a new article record for the native library." />
            <View style={{ gap: spacing.md }}>
              <Field label="Title" value={articleDraft.title} onChangeText={(title) => setArticleDraft((current) => ({ ...current, title }))} />
              <Field label="Description" value={articleDraft.description} onChangeText={(description) => setArticleDraft((current) => ({ ...current, description }))} multiline />
              <Field label="LinkedIn URL" value={articleDraft.linkedinUrl} onChangeText={(linkedinUrl) => setArticleDraft((current) => ({ ...current, linkedinUrl }))} />
              <Field label="PDF URL" value={articleDraft.pdfUrl} onChangeText={(pdfUrl) => setArticleDraft((current) => ({ ...current, pdfUrl }))} />
              <Field label="Featured" value={articleDraft.featured} onChangeText={(featured) => setArticleDraft((current) => ({ ...current, featured }))} helper="Use true or false." />
              <Field label="Publish timestamp" value={articleDraft.publishDate} onChangeText={(publishDate) => setArticleDraft((current) => ({ ...current, publishDate }))} helper="Milliseconds since epoch." />
              <PrimaryButton title="Publish article" onPress={publishArticle} />
            </View>
          </Card>

          <Card>
            <SectionHeader title="Publish resource" subtitle="Create a PDF, file, or reference asset." />
            <View style={{ gap: spacing.md }}>
              <Field label="Title" value={resourceDraft.title} onChangeText={(title) => setResourceDraft((current) => ({ ...current, title }))} />
              <Field label="Description" value={resourceDraft.description} onChangeText={(description) => setResourceDraft((current) => ({ ...current, description }))} multiline />
              <Field label="File URL" value={resourceDraft.fileUrl} onChangeText={(fileUrl) => setResourceDraft((current) => ({ ...current, fileUrl }))} />
              <Field label="Category" value={resourceDraft.category} onChangeText={(category) => setResourceDraft((current) => ({ ...current, category }))} />
              <PrimaryButton title="Publish resource" onPress={publishResource} />
            </View>
          </Card>
        </>
      ) : null}

      {section === "review" ? (
        <Card>
          <SectionHeader title="Review queue" subtitle="Public inquiries, assessment submissions, and resource leads." />
          {loading ? (
            <Text style={{ color: colors.muted }}>Loading...</Text>
          ) : error ? (
            <Text style={{ color: colors.danger }}>{error}</Text>
          ) : (
            <View style={{ gap: spacing.lg }}>
              <View style={{ gap: spacing.sm }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Inquiries</Text>
                {inquiries.length === 0 ? (
                  <Text style={{ color: colors.muted }}>No public inquiries yet.</Text>
                ) : (
                  inquiries.slice(0, 5).map((inquiry) => (
                    <PressableCard key={inquiry.id}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{inquiry.name}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{inquiry.email}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{inquiry.message}</Text>
                    </PressableCard>
                  ))
                )}
              </View>

              <View style={{ gap: spacing.sm }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Assessment submissions</Text>
                {assessmentSubmissions.length === 0 ? (
                  <Text style={{ color: colors.muted }}>No assessment submissions yet.</Text>
                ) : (
                  assessmentSubmissions.slice(0, 5).map((submission) => (
                    <PressableCard key={submission.id}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{submission.candidateName}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{submission.candidateEmail}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
                        Score: {submission.overallScore ?? submission.aiScore ?? submission.quizScore ?? "n/a"}
                      </Text>
                    </PressableCard>
                  ))
                )}
              </View>

              <View style={{ gap: spacing.sm }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Resource leads</Text>
                {resourceLeads.length === 0 ? (
                  <Text style={{ color: colors.muted }}>No resource leads yet.</Text>
                ) : (
                  resourceLeads.slice(0, 5).map((lead) => (
                    <PressableCard key={lead.id}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{lead.name}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{lead.email}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{lead.resourceTitle}</Text>
                    </PressableCard>
                  ))
                )}
              </View>
            </View>
          )}
        </Card>
      ) : null}

      {section === "analytics" ? (
        <Card>
          <SectionHeader title="Analytics" subtitle="Monthly visitor, event, and usage snapshots from the backend." />
          {loading ? (
            <Text style={{ color: colors.muted }}>Loading...</Text>
          ) : (
            <View style={{ gap: spacing.lg }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                <Pill tone="neutral">AI usage loaded</Pill>
                <Pill tone="neutral">{usageEvents.length} usage events</Pill>
                <Pill tone="neutral">{formatDate(new Date())}</Pill>
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Visitor analytics</Text>
                <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
                  Month: {visitorAnalytics?.month ?? 0} · Quarter: {visitorAnalytics?.quarter ?? 0} · Year: {visitorAnalytics?.year ?? 0}
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Event analytics</Text>
                <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
                  Month: {eventAnalytics?.month ?? 0} · Quarter: {eventAnalytics?.quarter ?? 0} · Year: {eventAnalytics?.year ?? 0}
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>AI usage snapshot</Text>
                <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
                  {JSON.stringify(aiUsage ?? {}, null, 2)}
                </Text>
              </View>

              <View style={{ gap: spacing.sm }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Usage events</Text>
                {usageEvents.length === 0 ? (
                  <Text style={{ color: colors.muted }}>No usage events available.</Text>
                ) : (
                  usageEvents.slice(0, 5).map((event) => (
                    <PressableCard key={event.id}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{event.toolName ?? event.eventName ?? "Event"}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{event.name ?? event.eventType ?? "Tracked event"}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{formatRelativeTime(event.createdAt ?? Date.now())}</Text>
                    </PressableCard>
                  ))
                )}
              </View>
            </View>
          )}
        </Card>
      ) : null}
    </ScreenScrollView>
  );
}
